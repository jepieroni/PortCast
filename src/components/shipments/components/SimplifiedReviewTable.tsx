
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

interface SimplifiedReviewTableProps {
  stagingData: any[];
  validatingRecords: Set<string>;
  onViewEditClick: (record: any) => void;
}

const SimplifiedReviewTable = ({
  stagingData,
  validatingRecords,
  onViewEditClick
}: SimplifiedReviewTableProps) => {
  const getStatusBadge = (status: string, validationErrors: any, recordId: string) => {
    // Always show loading badge if record is currently being validated
    if (validatingRecords.has(recordId)) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 size={12} className="animate-spin mr-1" />
          Validating...
        </Badge>
      );
    }

    // Show loading badge for pending status (initial state before validation)
    if (status === 'pending') {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 size={12} className="animate-spin mr-1" />
          Pending...
        </Badge>
      );
    }

    // Only show static badges for records that have completed validation
    if (status === 'valid') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>;
    } else if (status === 'invalid') {
      return <Badge variant="destructive">Invalid</Badge>;
    } else {
      // For any unknown status, show loading
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 size={12} className="animate-spin mr-1" />
          Processing...
        </Badge>
      );
    }
  };

  const getActionButton = (record: any) => {
    const isValidating = validatingRecords.has(record.id);
    
    // No button while validating or pending
    if (isValidating || record.validation_status === 'pending') {
      return null;
    }

    if (record.validation_status === 'valid') {
      return (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onViewEditClick(record)}
          className="h-8 text-xs px-3"
        >
          View/Edit Details
        </Button>
      );
    } else if (record.validation_status === 'invalid') {
      return (
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => onViewEditClick(record)}
          className="h-8 text-xs px-3"
        >
          Fix Errors
        </Button>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Records</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review imported shipment data. Use the action buttons to view details or fix validation errors.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-24 min-w-24">Status</TableHead>
                <TableHead className="w-48 min-w-48">GBL Number</TableHead>
                <TableHead className="w-48 min-w-48">Shipper Name</TableHead>
                <TableHead className="w-40 min-w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stagingData.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/50">
                  <TableCell className="p-4">
                    {getStatusBadge(record.validation_status, record.validation_errors, record.id)}
                  </TableCell>
                  <TableCell className="p-4 font-medium">
                    {record.gbl_number || 'N/A'}
                  </TableCell>
                  <TableCell className="p-4">
                    {record.shipper_last_name || 'N/A'}
                  </TableCell>
                  <TableCell className="p-4">
                    {getActionButton(record)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {stagingData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No shipment records to display
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimplifiedReviewTable;
