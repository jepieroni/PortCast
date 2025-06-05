
import { Button } from '@/components/ui/button';

interface ActionButtonComponentProps {
  record: any;
  validatingRecords: Set<string>;
  onViewEditClick: (record: any) => void;
}

export const ActionButtonComponent = ({
  record,
  validatingRecords,
  onViewEditClick
}: ActionButtonComponentProps) => {
  const isValidating = validatingRecords.has(record.id);
  const status = record.status;
  
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
