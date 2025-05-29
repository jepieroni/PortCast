
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RequestFilters from '@/components/access-requests/RequestFilters';
import OrganizationRequestsTable from '@/components/access-requests/OrganizationRequestsTable';
import UserRequestsTable from '@/components/access-requests/UserRequestsTable';

interface AccessRequestManagementProps {
  onBack: () => void;
}

interface OrgRequest {
  id: string;
  organization_name: string;
  first_name: string;
  last_name: string;
  email: string;
  city?: string;
  state?: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
}

interface UserRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  organization_name: string;
  status: string;
  requested_at: string;
  reviewed_at?: string;
  approval_token: string;
}

const AccessRequestManagement = ({ onBack }: AccessRequestManagementProps) => {
  const { toast } = useToast();
  const [orgRequests, setOrgRequests] = useState<OrgRequest[]>([]);
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Fetch organization requests
      const { data: orgData, error: orgError } = await supabase
        .from('organization_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgError) throw orgError;

      // Fetch user requests with organization info
      const { data: userData, error: userError } = await supabase
        .from('user_requests')
        .select(`
          *,
          organizations (name)
        `)
        .order('requested_at', { ascending: false });

      if (userError) throw userError;

      setOrgRequests(orgData || []);
      setUserRequests(userData?.map(req => ({
        ...req,
        organization_name: req.organizations?.name || 'Unknown'
      })) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch access requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgRequestAction = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      const { error } = await supabase
        .from('organization_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'denied',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization request ${action}d successfully`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${action} organization request`,
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
            // Don't throw here as the main approval was successful
          } else {
            console.log('Account setup email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending account setup email:', emailError);
          // Don't throw here as the main approval was successful
        }
      }

      toast({
        title: "Success",
        description: result.message,
      });

      fetchRequests();
    } catch (error: any) {
      console.error('Error in handleUserRequestAction:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user request`,
        variant: "destructive",
      });
    }
  };

  const filterRequests = (requests: any[]) => {
    if (statusFilter === 'all') return requests;
    return requests.filter(req => req.status === statusFilter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading access requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">App Access Request Management</h2>
      </div>

      <RequestFilters 
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <Tabs defaultValue="organizations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building size={16} />
            Organization Requests ({filterRequests(orgRequests).length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User size={16} />
            User Requests ({filterRequests(userRequests).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <OrganizationRequestsTable 
            requests={filterRequests(orgRequests)}
            onAction={handleOrgRequestAction}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserRequestsTable 
            requests={filterRequests(userRequests)}
            onAction={handleUserRequestAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessRequestManagement;
