
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface OrgUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface OrgUserRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  requested_at: string;
  reviewed_at?: string;
  approval_token: string;
}

export const useOrgAdminData = () => {
  const { toast } = useToast();
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [userRequests, setUserRequests] = useState<OrgUserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchOrganizationData = async () => {
    try {
      console.log('Fetching organization data...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('Current user ID:', user.id);

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }
      
      if (!profile?.organization_id) {
        console.error('No organization_id found for user');
        toast({
          title: "Error",
          description: "You are not associated with an organization",
          variant: "destructive",
        });
        return;
      }

      console.log('Organization ID:', profile.organization_id);
      setOrganizationId(profile.organization_id);

      // Fetch organization users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('organization_id', profile.organization_id);

      if (usersError) {
        console.error('Users fetch error:', usersError);
        throw usersError;
      }

      console.log('Users data:', usersData);

      // Fetch user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('organization_id', profile.organization_id);

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        throw rolesError;
      }

      console.log('Roles data:', rolesData);

      // Combine users with their roles
      const formattedUsers = usersData?.map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: rolesData?.find(role => role.user_id === user.id)?.role
      })) || [];

      console.log('Formatted users:', formattedUsers);

      // Fetch user requests for this organization only
      const { data: requestsData, error: requestsError } = await supabase
        .from('user_requests')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('requested_at', { ascending: false });

      if (requestsError) {
        console.error('Requests fetch error:', requestsError);
        throw requestsError;
      }

      console.log('Requests data:', requestsData);

      setOrgUsers(formattedUsers);
      setUserRequests(requestsData || []);
    } catch (error: any) {
      console.error('Error in fetchOrganizationData:', error);
      toast({
        title: "Error",
        description: "Failed to fetch organization data: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole as UserRole,
          organization_id: organizationId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchOrganizationData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleUserRequestAction = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      // Find the request to get the approval token
      const request = userRequests.find(req => req.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      console.log(`${action === 'approve' ? 'Approving' : 'Denying'} user request with token:`, request.approval_token);

      // Use the approve_user_request database function
      const { data, error } = await supabase.rpc('approve_user_request', {
        _approval_token: request.approval_token,
        _approve: action === 'approve'
      });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Approval result:', data);

      const result = data as { success: boolean; message: string; setup_token_id?: string; organization_id?: string };

      if (!result.success) {
        throw new Error(result.message || `Failed to ${action} request`);
      }

      // If approval was successful and we have setup_token_id, send the account setup email
      if (action === 'approve' && result.setup_token_id) {
        console.log('Sending account setup email for token:', result.setup_token_id);
        
        try {
          const { error: emailError } = await supabase.functions.invoke('send-user-account-setup', {
            body: {
              setupTokenId: result.setup_token_id
            }
          });

          if (emailError) {
            console.error('Failed to send account setup email:', emailError);
          } else {
            console.log('Account setup email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending account setup email:', emailError);
        }
      }

      toast({
        title: "Success",
        description: result.message,
      });

      fetchOrganizationData();
    } catch (error: any) {
      console.error('Error in handleUserRequestAction:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user request`,
        variant: "destructive",
      });
    }
  };

  return {
    orgUsers,
    userRequests,
    loading,
    organizationId,
    fetchOrganizationData,
    updateUserRole,
    handleUserRequestAction
  };
};
