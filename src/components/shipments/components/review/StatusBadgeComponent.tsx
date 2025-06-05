
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeComponentProps {
  record: any;
  validatingRecords: Set<string>;
}

export const StatusBadgeComponent = ({
  record,
  validatingRecords
}: StatusBadgeComponentProps) => {
  const recordId = record.id;
  
  // Use the validation_status from the database as the authoritative source
  const dbStatus = record.validation_status;
  // Fallback to the computed status from the record
  const computedStatus = record.status;
  
  // Priority: Use database status if available, otherwise use computed status
  const finalStatus = dbStatus || computedStatus;
  
  console.log(`🎨 STATUS BADGE: === COMPREHENSIVE DEBUG for ${record.gbl_number || recordId} ===`);
  console.log(`🎨 STATUS BADGE: Full record:`, record);
  console.log(`🎨 STATUS BADGE: dbStatus = "${dbStatus}"`);
  console.log(`🎨 STATUS BADGE: computedStatus = "${computedStatus}"`);
  console.log(`🎨 STATUS BADGE: finalStatus = "${finalStatus}"`);
  console.log(`🎨 STATUS BADGE: validatingRecords.has(recordId) =`, validatingRecords.has(recordId));
  console.log(`🎨 STATUS BADGE: About to check conditions...`);
  
  // Always show loading badge if record is currently being validated
  if (validatingRecords.has(recordId)) {
    console.log(`🎨 STATUS BADGE: CONDITION: Validating - RENDERING LOADING BADGE`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Validating...
      </Badge>
    );
  }

  // Show loading badge for pending status (initial state before validation)
  if (finalStatus === 'pending') {
    console.log(`🎨 STATUS BADGE: CONDITION: Pending - RENDERING PENDING BADGE`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Pending...
      </Badge>
    );
  }

  // Check for warning status and force yellow styling - REMOVE variant prop entirely
  if (finalStatus === 'warning') {
    console.log(`🎨 STATUS BADGE: CONDITION: Warning - RENDERING YELLOW WARNING BADGE`);
    
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500">
        <AlertTriangle size={12} className="mr-1" />
        Warning
      </span>
    );
  }

  // Only show static badges for records that have completed validation
  if (finalStatus === 'valid') {
    console.log(`🎨 STATUS BADGE: CONDITION: Valid - RENDERING GREEN VALID BADGE`);
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-green-500 text-white hover:bg-green-600 border-green-500">
        <CheckCircle size={12} className="mr-1" />
        Valid
      </span>
    );
  } else if (finalStatus === 'invalid') {
    console.log(`🎨 STATUS BADGE: CONDITION: Invalid - RENDERING RED INVALID BADGE`);
    return (
      <Badge variant="destructive">
        <XCircle size={12} className="mr-1" />
        Invalid
      </Badge>
    );
  } else {
    // For any unknown status, show loading
    console.log(`🎨 STATUS BADGE: CONDITION: Unknown status "${finalStatus}" - RENDERING LOADING FALLBACK`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Processing...
      </Badge>
    );
  }
};
