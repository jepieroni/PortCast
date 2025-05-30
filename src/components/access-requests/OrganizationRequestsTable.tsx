
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader, Building2 } from 'lucide-react';

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

interface OrganizationRequestsTableProps {
  requests: OrgRequest[];
  onAction: (requestId: string, action: 'approve' | 'deny') => void;
  processingRequestId?: string | null;
}

const OrganizationRequestsTable = ({ requests, onAction, processingRequestId }: OrganizationRequestsTableProps) => {
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

  const formatLocation = (city?: string, state?: string) => {
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return 'Not specified';
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">No organization requests found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={20} />
          Organization Requests
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
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="font-medium">{request.organization_name}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{`${request.first_name} ${request.last_name}`}</div>
                    <div className="text-sm text-gray-500">{request.email}</div>
                  </div>
                </TableCell>
                <TableCell>{formatLocation(request.city, request.state)}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAction(request.id, 'approve')}
                        disabled={processingRequestId === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingRequestId === request.id ? (
                          <Loader size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onAction(request.id, 'deny')}
                        disabled={processingRequestId === request.id}
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

export default OrganizationRequestsTable;
