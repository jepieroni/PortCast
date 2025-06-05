
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle } from 'lucide-react';

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
  const getStatusBadge = (record: any) => {
    const recordId = record.id;
    const status = record.status; // Use the converted status, not validation_status
    
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

    // Check for warning status and force yellow styling
    if (status === 'warning') {
      return (
        <Badge variant="warning" className="bg-yellow-500 text-white hover:bg-yellow-600">
          <AlertTriangle size={12} className="mr-1" />
          Warning
        </Badge>
      );
    }

    // Only show static badges for records that have completed validation
    if (status === 'valid') {
      return <Badge variant="success">Valid</Badge>;
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
    const status = record.status; // Use the converted status
    
    // No button while validating or pending
    if (isValidating || status === 'pending') {
      return null;
    }

    // Show action button text based on status
    if (status === 'valid') {
      // Check for warnings using the warnings array from the converted record
      const hasWarnings = record.warnings && 
                          Array.isArray(record.warnings) && 
                          record.warnings.length > 0;
      
      const buttonText = hasWarnings ? 'Review Warnings' : 'View/Edit Details';
      const buttonVariant = hasWarnings ? 'outline' : 'outline';
      
      return (
        <Button 
          size="sm" 
          variant={buttonVariant}
          onClick={() => onViewEditClick(record)}
          className={`h-8 text-xs px-3 ${hasWarnings ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' : ''}`}
        >
          {buttonText}
        </Button>
      );
    } else if (status === 'warning') {
      return (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onViewEditClick(record)}
          className="h-8 text-xs px-3 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
        >
          Review Warnings
        </Button>
      );
    } else if (status === 'invalid') {
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

  const getValidationWarnings = (record: any): string[] => {
    // Use the warnings array from the converted record first
    if (record.warnings && Array.isArray(record.warnings)) {
      return record.warnings;
    }
    
    // Fallback to validation_warnings if needed
    if (!record.validation_warnings) return [];
    if (Array.isArray(record.validation_warnings)) return record.validation_warnings;
    if (typeof record.validation_warnings === 'string') {
      try {
        const parsed = JSON.parse(record.validation_warnings);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [record.validation_warnings];
      }
    }
    return [];
  };

  const getValidationErrors = (record: any): string[] => {
    // Use the errors array from the converted record first
    if (record.errors && Array.isArray(record.errors)) {
      return record.errors;
    }
    
    // Fallback to validation_errors if needed
    if (!record.validation_errors) return [];
    if (Array.isArray(record.validation_errors)) return record.validation_errors;
    if (typeof record.validation_errors === 'string') {
      try {
        const parsed = JSON.parse(record.validation_errors);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [record.validation_errors];
      }
    }
    return [];
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
              {stagingData.map((record) => {
                const validationErrors = getValidationErrors(record);
                const validationWarnings = getValidationWarnings(record);
                
                return (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell className="p-4">
                      <div className="space-y-2">
                        {getStatusBadge(record)}
                        
                        {validationErrors.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <div className="text-sm text-red-800">
                              <strong>Errors:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {validationErrors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {validationWarnings.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <div className="text-sm text-yellow-800">
                              <strong>Warnings:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {validationWarnings.map((warning, index) => (
                                  <li key={index}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
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
                );
              })}
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
