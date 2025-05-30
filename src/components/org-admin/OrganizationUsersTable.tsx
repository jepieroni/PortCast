
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import type { OrgUser } from '@/types/orgAdmin';

interface OrganizationUsersTableProps {
  orgUsers: OrgUser[];
  onUpdateUserRole: (userId: string, newRole: string) => void;
}

export const OrganizationUsersTable = ({ orgUsers }: OrganizationUsersTableProps) => {
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
