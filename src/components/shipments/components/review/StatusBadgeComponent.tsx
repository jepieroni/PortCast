
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
  
  console.log(`🎨 STATUS BADGE: Rendering badge for ${record.gbl_number || recordId}`);
  console.log(`🎨 STATUS BADGE: dbStatus = "${dbStatus}"`);
  console.log(`🎨 STATUS BADGE: computedStatus = "${computedStatus}"`);
  console.log(`🎨 STATUS BADGE: finalStatus = "${finalStatus}"`);
  console.log(`🎨 STATUS BADGE: validatingRecords.has(recordId) =`, validatingRecords.has(recordId));
  
  // Always show loading badge if record is currently being validated
  if (validatingRecords.has(recordId)) {
    console.log(`🎨 STATUS BADGE: RENDERING LOADING BADGE for ${record.gbl_number} (validating)`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Validating...
      </Badge>
    );
  }

  // Show loading badge for pending status (initial state before validation)
  if (finalStatus === 'pending') {
    console.log(`🎨 STATUS BADGE: RENDERING PENDING BADGE for ${record.gbl_number} (pending)`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Pending...
      </Badge>
    );
  }

  // Check for warning status and force yellow styling
  if (finalStatus === 'warning') {
    console.log(`🎨 STATUS BADGE: ✅ RENDERING WARNING BADGE for ${record.gbl_number} - SHOULD BE YELLOW`);
    
    return (
      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500">
        <AlertTriangle size={12} className="mr-1" />
        Warning
      </Badge>
    );
  }

  // Only show static badges for records that have completed validation
  if (finalStatus === 'valid') {
    console.log(`🎨 STATUS BADGE: RENDERING VALID BADGE for ${record.gbl_number} (valid) - SHOULD BE GREEN`);
    return (
      <Badge className="bg-green-500 text-white hover:bg-green-600 border-green-500">
        <CheckCircle size={12} className="mr-1" />
        Valid
      </Badge>
    );
  } else if (finalStatus === 'invalid') {
    console.log(`🎨 STATUS BADGE: RENDERING INVALID BADGE for ${record.gbl_number} (invalid) - SHOULD BE RED`);
    return (
      <Badge variant="destructive">
        <XCircle size={12} className="mr-1" />
        Invalid
      </Badge>
    );
  } else {
    // For any unknown status, show loading
    console.log(`🎨 STATUS BADGE: ❌ UNKNOWN STATUS: "${finalStatus}" for ${record.gbl_number} - FALLBACK TO LOADING`);
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 size={12} className="animate-spin mr-1" />
        Processing...
      </Badge>
    );
  }
};
