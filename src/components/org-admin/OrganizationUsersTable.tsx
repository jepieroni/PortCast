
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, MoreVertical, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OrgUser } from '@/types/orgAdmin';

interface OrganizationUsersTableProps {
  orgUsers: OrgUser[];
  onUpdateUserRole: (userId: string, newRole: string) => void;
  onRefreshData: () => void;
}

export const OrganizationUsersTable = ({ orgUsers, onUpdateUserRole, onRefreshData }: OrganizationUsersTableProps) => {
  const { toast } = useToast();

  const handleDisableAccount = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('disable_user_account', {
        _user_id: userId
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: "Success",
        description: result.message,
      });

      onRefreshData();
    } catch (error: any) {
      console.error('Error disabling account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable account",
        variant: "destructive",
      });
    }
  };

  return (
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
                  {user.role === 'org_admin' ? (
                    <span className="text-gray-400 text-sm">No actions available</span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border shadow-md">
                        <DropdownMenuItem
                          onClick={() => handleDisableAccount(user.id)}
                          className="cursor-pointer text-red-600 hover:text-red-700"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Disable Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
