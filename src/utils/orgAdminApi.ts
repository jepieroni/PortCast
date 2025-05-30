import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { OrgUser, OrgUserRequest } from '@/types/orgAdmin';

type UserRole = Database['public']['Enums']['user_role'];

export const fetchUserOrganization = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw profileError;
  }
  
  if (!profile?.organization_id) {
    throw new Error('No organization_id found for user');
  }

  return profile.organization_id;
};

export const fetchOrganizationUsers = async (organizationId: string): Promise<OrgUser[]> => {
  console.log('=== DEBUGGING fetchOrganizationUsers ===');
  console.log('Looking for users in organization:', organizationId);
  
  // First, fetch all users in the organization
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('organization_id', organizationId);

  console.log('Raw users query result:', { usersData, usersError });
  console.log('Number of users found:', usersData?.length || 0);
  
  if (usersData) {
    usersData.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`
      });
    });
  }

  if (usersError) {
    console.error('Error fetching users:', usersError);
    throw usersError;
  }

  if (!usersData || usersData.length === 0) {
    console.log('No users found, returning empty array');
    return [];
  }

  // Get all user IDs for this organization
  const userIds = usersData.map(user => user.id);
  console.log('User IDs to fetch roles for:', userIds);

  // Separately fetch user roles for these users
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds);

  console.log('Raw roles query result:', { rolesData, rolesError });
  
  if (rolesData) {
    rolesData.forEach((roleRecord, index) => {
      console.log(`Role ${index + 1}:`, {
        user_id: roleRecord.user_id,
        role: roleRecord.role
      });
    });
  }

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    // Don't throw here, just continue without roles
  }

  // Create a map of user roles for easy lookup
  const roleMap = new Map<string, UserRole>();
  rolesData?.forEach(roleRecord => {
    roleMap.set(roleRecord.user_id, roleRecord.role);
  });

  console.log('Role map created:', Object.fromEntries(roleMap));

  // Transform the data to match our OrgUser interface
  const finalResult = usersData.map(user => ({
    id: user.id,
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: roleMap.get(user.id) || undefined
  }));

  console.log('Final transformed result:', finalResult);
  console.log('=== END DEBUGGING ===');

  return finalResult;
};

export const fetchUserRequests = async (organizationId: string): Promise<OrgUserRequest[]> => {
  const { data: requestsData, error: requestsError } = await supabase
    .from('user_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .order('requested_at', { ascending: false });

  if (requestsError) {
    throw requestsError;
  }

  return requestsData || [];
};

export const updateUserRoleInDb = async (
  userId: string, 
  newRole: string, 
  organizationId: string | null
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role: newRole as UserRole,
      organization_id: organizationId,
      assigned_by: user?.id
    });

  if (error) throw error;
};

export const processUserRequest = async (requestId: string, action: 'approve' | 'deny') => {
  // Find the request to get the approval token
  const { data: requestData, error: requestError } = await supabase
    .from('user_requests')
    .select('approval_token')
    .eq('id', requestId)
    .single();

  if (requestError) {
    throw requestError;
  }

  if (!requestData) {
    throw new Error('Request not found');
  }

  // Use the approve_user_request database function
  const { data, error } = await supabase.rpc('approve_user_request', {
    _approval_token: requestData.approval_token,
    _approve: action === 'approve'
  });

  if (error) {
    throw error;
  }

  const result = data as { success: boolean; message: string; setup_token_id?: string; organization_id?: string };

  if (!result.success) {
    throw new Error(result.message || `Failed to ${action} request`);
  }

  return result;
};

export const sendAccountSetupEmail = async (setupTokenId: string) => {
  const { error: emailError } = await supabase.functions.invoke('send-user-account-setup', {
    body: {
      setupTokenId: setupTokenId
    }
  });

  if (emailError) {
    throw emailError;
  }
};
