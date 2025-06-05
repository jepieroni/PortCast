
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
  
  // COMPREHENSIVE DEBUG: Log everything about this record's status and badge rendering
  console.log(`=== StatusBadgeComponent COMPREHENSIVE DEBUG for ${record.gbl_number || recordId} ===`);
  console.log('record.status:', status);
  console.log('record.validation_status:', record.validation_status);
  console.log('record.warnings:', record.warnings);
  console.log('record.validation_warnings:', record.validation_warnings);
  console.log('record.errors:', record.errors);
  console.log('record.validation_errors:', record.validation_errors);
  console.log('validatingRecords.has(recordId):', validatingRecords.has(recordId));
  console.log('Full record object:', record);
  
  // Always show loading badge if record is currently being validated
  if (validatingRecords.has(recordId)) {
    console.log(`RENDERING LOADING BADGE for ${record.gbl_number} (validating)`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Validating...
      </Badge>
    );
  }

  // Show loading badge for pending status (initial state before validation)
  if (status === 'pending') {
    console.log(`RENDERING PENDING BADGE for ${record.gbl_number} (pending)`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Pending...
      </Badge>
    );
  }

  // DEBUG: Log the exact condition checks for warning status
  console.log(`STATUS CHECK for ${record.gbl_number}:`);
  console.log('  status === "warning":', status === 'warning');
  console.log('  typeof status:', typeof status);
  console.log('  status value (JSON):', JSON.stringify(status));
  
  // Check for warning status and force yellow styling
  if (status === 'warning') {
    console.log(`✅ RENDERING WARNING BADGE for ${record.gbl_number} - SHOULD BE YELLOW`);
    console.log('Badge variant will be: "warning"');
    console.log('Badge className will be: "bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500"');
    
    const warningBadge = (
      <Badge variant="warning" className="bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500">
        <AlertTriangle size={12} className="mr-1" />
        Warning
      </Badge>
    );
    
    console.log('Warning badge element:', warningBadge);
    return warningBadge;
  }

  // Only show static badges for records that have completed validation
  if (status === 'valid') {
    console.log(`RENDERING VALID BADGE for ${record.gbl_number} (valid)`);
    return <Badge variant="success">Valid</Badge>;
  } else if (status === 'invalid') {
    console.log(`RENDERING INVALID BADGE for ${record.gbl_number} (invalid)`);
    return <Badge variant="destructive">Invalid</Badge>;
  } else {
    // For any unknown status, show loading
    console.log(`❌ UNKNOWN STATUS: "${status}" for ${record.gbl_number} - FALLBACK TO LOADING`);
    console.log('Status type:', typeof status);
    console.log('Status stringified:', JSON.stringify(status));
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Processing...
      </Badge>
    );
  }
};
