
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, MoreVertical, UserPlus, UserMinus } from 'lucide-react';
import type { OrgUser } from '@/types/orgAdmin';

interface OrganizationUsersTableProps {
  orgUsers: OrgUser[];
  onUpdateUserRole: (userId: string, newRole: string) => void;
}

export const OrganizationUsersTable = ({ orgUsers, onUpdateUserRole }: OrganizationUsersTableProps) => {
  const handlePromoteToAdmin = (userId: string) => {
    onUpdateUserRole(userId, 'org_admin');
  };

  const handleDemoteToUser = (userId: string) => {
    onUpdateUserRole(userId, 'user');
  };

  const canDemoteUser = (user: OrgUser) => {
    // Cannot demote if user is already a regular user, or if they're an org_admin
    // (org admins cannot demote other org admins)
    return user.role === 'org_admin' ? false : false;
  };

  const canPromoteUser = (user: OrgUser) => {
    // Can promote if user is currently just a regular user
    return user.role === 'user';
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
              <TableHead>Quick Role Change</TableHead>
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
                    onValueChange={(value) => onUpdateUserRole(user.id, value)}
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border shadow-md">
                      {canPromoteUser(user) && (
                        <DropdownMenuItem
                          onClick={() => handlePromoteToAdmin(user.id)}
                          className="cursor-pointer"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Promote to Admin
                        </DropdownMenuItem>
                      )}
                      {canDemoteUser(user) && (
                        <DropdownMenuItem
                          onClick={() => handleDemoteToUser(user.id)}
                          className="cursor-pointer"
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Demote to User
                        </DropdownMenuItem>
                      )}
                      {!canPromoteUser(user) && !canDemoteUser(user) && (
                        <DropdownMenuItem disabled>
                          No actions available
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
