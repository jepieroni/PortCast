
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Building, User, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      const { error } = await supabase
        .from('user_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'denied',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User request ${action}d successfully`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${action} user request`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by status:</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building size={20} />
                Organization Registration Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterRequests(orgRequests).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.organization_name}</TableCell>
                      <TableCell>
                        <div>
                          <div>{`${request.first_name} ${request.last_name}`}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.city && request.state ? `${request.city}, ${request.state}` : 'Not specified'}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOrgRequestAction(request.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOrgRequestAction(request.id, 'deny')}
                            >
                              <X size={14} className="mr-1" />
                              Deny
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-sm text-gray-500">
                            {request.reviewed_at ? `Reviewed ${new Date(request.reviewed_at).toLocaleDateString()}` : 'No action needed'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                User Access Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterRequests(userRequests).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{`${request.first_name} ${request.last_name}`}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.organization_name}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.requested_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUserRequestAction(request.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUserRequestAction(request.id, 'deny')}
                            >
                              <X size={14} className="mr-1" />
                              Deny
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-sm text-gray-500">
                            {request.reviewed_at ? `Reviewed ${new Date(request.reviewed_at).toLocaleDateString()}` : 'No action needed'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessRequestManagement;
