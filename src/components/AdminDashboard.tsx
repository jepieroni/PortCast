
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building, Ship, ArrowLeft, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignRoleEmail, setAssignRoleEmail] = useState('');
  const [assignRole, setAssignRole] = useState('user');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Access Denied",
          description: "You must be logged in to access admin features",
          variant: "destructive",
        });
        onBack();
        return;
      }

      setCurrentUser(user);

      // Check if user has global admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error checking role:', roleError);
      }

      setUserRole(roleData?.role || null);
      setLoading(false);

      if (!roleData || roleData.role !== 'global_admin') {
        toast({
          title: "Access Denied",
          description: "You need Global Admin privileges to access this area",
          variant: "destructive",
        });
        onBack();
      }
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
      onBack();
    }
  };

  const assignGlobalAdminToSelf = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: currentUser.id,
          role: 'global_admin',
          assigned_by: currentUser.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Assigned",
            description: "You already have the Global Admin role",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Global Admin role assigned successfully",
        });
        setUserRole('global_admin');
      }
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign Global Admin role",
        variant: "destructive",
      });
    }
  };

  const assignRoleToUser = async () => {
    if (!assignRoleEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', assignRoleEmail)
        .single();

      if (userError || !userData) {
        toast({
          title: "User Not Found",
          description: "No user found with that email address",
          variant: "destructive",
        });
        return;
      }

      // Assign the role
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userData.id,
          role: assignRole,
          assigned_by: currentUser.id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `${assignRole} role assigned to ${assignRoleEmail}`,
      });
      setAssignRoleEmail('');
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-lg text-gray-600">Checking admin access...</p>
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
        <h2 className="text-2xl font-bold">Global Admin Dashboard</h2>
        <Badge variant="destructive">ADMIN ACCESS</Badge>
      </div>

      {userRole !== 'global_admin' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <UserCheck size={20} />
              Initial Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              You need to assign yourself the Global Admin role to access all admin features.
            </p>
            <Button onClick={assignGlobalAdminToSelf} className="bg-orange-600 hover:bg-orange-700">
              Assign Global Admin Role to Myself
            </Button>
          </CardContent>
        </Card>
      )}

      {userRole === 'global_admin' && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users size={24} />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Manage user roles and permissions</p>
                <Button className="w-full">Manage Users</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-emerald-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Building size={24} />
                  Organizations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Manage organizations and trusted agents</p>
                <Button className="w-full">Manage Organizations</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-purple-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Ship size={24} />
                  System Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Manage ports, countries, and TSPs</p>
                <Button className="w-full">Manage Data</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assign Role to User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userEmail">User Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={assignRoleEmail}
                  onChange={(e) => setAssignRoleEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={assignRole} onValueChange={setAssignRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                    <SelectItem value="global_admin">Global Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={assignRoleToUser} className="w-full">
                Assign Role
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
