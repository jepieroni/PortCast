
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

interface StatusBadgeComponentProps {
  record: any;
  validatingRecords: Set<string>;
}

export const StatusBadgeComponent = ({
  record,
  validatingRecords
}: StatusBadgeComponentProps) => {
  const recordId = record.id;
  const status = record.status;
  
  // DEBUG: Log everything about this record's status
  console.log(`=== StatusBadgeComponent DEBUG for ${record.gbl_number || recordId} ===`);
  console.log('record.status:', status);
  console.log('record.validation_status:', record.validation_status);
  console.log('validatingRecords.has(recordId):', validatingRecords.has(recordId));
  console.log('Full record object:', record);
  console.log('=== END DEBUG ===');
  
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
    console.log(`RENDERING WARNING BADGE for ${record.gbl_number}`);
    return (
      <Badge variant="warning" className="bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500">
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
    console.log(`UNKNOWN STATUS: ${status} for ${record.gbl_number}`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Processing...
      </Badge>
    );
  }
};
