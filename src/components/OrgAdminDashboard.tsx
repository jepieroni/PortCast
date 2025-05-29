
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, FileText, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrgAdminDashboardProps {
  onBack: () => void;
}

interface OrgUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
}

interface OrgUserRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  requested_at: string;
  reviewed_at?: string;
}

const OrgAdminDashboard = ({ onBack }: OrgAdminDashboardProps) => {
  const { toast } = useToast();
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [userRequests, setUserRequests] = useState<OrgUserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.organization_id) {
        toast({
          title: "Error",
          description: "You are not associated with an organization",
          variant: "destructive",
        });
        return;
      }

      setOrganizationId(profile.organization_id);

      // Fetch organization users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles (role)
        `)
        .eq('organization_id', profile.organization_id);

      if (usersError) throw usersError;

      // Fetch user requests for this organization
      const { data: requestsData, error: requestsError } = await supabase
        .from('user_requests')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      const formattedUsers = usersData?.map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.user_roles?.[0]?.role
      })) || [];

      setOrgUsers(formattedUsers);
      setUserRequests(requestsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch organization data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      fetchOrganizationData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${action} user request`,
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization data...</p>
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
        <h2 className="text-2xl font-bold">Organization Admin Dashboard</h2>
        <Badge variant="default">ORG ADMIN</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Organization Users ({orgUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant={user.role === 'org_admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No role</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || ''}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="org_admin">Org Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              User Access Requests ({userRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{`${request.first_name} ${request.last_name}`}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUserRequestAction(request.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUserRequestAction(request.id, 'deny')}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrgAdminDashboard;
