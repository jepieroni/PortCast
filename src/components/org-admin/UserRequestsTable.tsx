
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Check, X } from 'lucide-react';
import type { OrgUserRequest } from '@/hooks/useOrgAdminData';

interface UserRequestsTableProps {
  userRequests: OrgUserRequest[];
  onHandleUserRequestAction: (requestId: string, action: 'approve' | 'deny') => void;
}

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

export const UserRequestsTable = ({ userRequests, onHandleUserRequestAction }: UserRequestsTableProps) => {
  return (
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
                        onClick={() => onHandleUserRequestAction(request.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onHandleUserRequestAction(request.id, 'deny')}
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
  );
};
