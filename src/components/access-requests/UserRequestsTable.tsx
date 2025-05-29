
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Check, X } from 'lucide-react';

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

interface UserRequestsTableProps {
  requests: UserRequest[];
  onAction: (requestId: string, action: 'approve' | 'deny') => void;
}

const UserRequestsTable = ({ requests, onAction }: UserRequestsTableProps) => {
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

  return (
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
            {requests.map((request) => (
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
                        onClick={() => onAction(request.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check size={14} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onAction(request.id, 'deny')}
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
  );
};

export default UserRequestsTable;
