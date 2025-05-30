
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { OrgUser, OrgUserRequest } from '@/types/orgAdmin';
import {
  fetchUserOrganization,
  fetchOrganizationUsers,
  fetchUserRequests,
  updateUserRoleInDb,
  processUserRequest,
  sendAccountSetupEmail
} from '@/utils/orgAdminApi';
import { supabase } from '@/integrations/supabase/client';

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
      const orgId = await fetchUserOrganization(user.id);
      console.log('Organization ID:', orgId);
      setOrganizationId(orgId);

      // Fetch organization users
      const users = await fetchOrganizationUsers(orgId);
      console.log('Formatted users:', users);
      setOrgUsers(users);

      // Fetch user requests
      const requests = await fetchUserRequests(orgId);
      console.log('Requests data:', requests);
      setUserRequests(requests);
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
      await updateUserRoleInDb(userId, newRole, organizationId);

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
      console.log(`${action === 'approve' ? 'Approving' : 'Denying'} user request:`, requestId);

      const result = await processUserRequest(requestId, action);
      console.log('Approval result:', result);

      // If approval was successful and we have setup_token_id, send the account setup email
      if (action === 'approve' && result.setup_token_id) {
        console.log('Sending account setup email for token:', result.setup_token_id);
        
        try {
          await sendAccountSetupEmail(result.setup_token_id);
          console.log('Account setup email sent successfully');
        } catch (emailError) {
          console.error('Failed to send account setup email:', emailError);
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
