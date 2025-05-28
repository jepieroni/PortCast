
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface RoleAssignmentProps {
  currentUser: any;
}

const RoleAssignment = ({ currentUser }: RoleAssignmentProps) => {
  const { toast } = useToast();
  const [assignRoleEmail, setAssignRoleEmail] = useState('');
  const [assignRole, setAssignRole] = useState<UserRole>('user');

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

  return (
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
          <Select value={assignRole} onValueChange={(value: UserRole) => setAssignRole(value)}>
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
  );
};

export default RoleAssignment;
