
import { Button } from '@/components/ui/button';

interface ReviewActionButtonsProps {
  validationSummary: {
    valid: number;
    invalid: number;
    pending: number;
  };
  isValidating: boolean;
  isProcessing: boolean;
  onValidateAll: () => void;
  onProcessShipments: () => void;
}

const ReviewActionButtons = ({
  validationSummary,
  isValidating,
  isProcessing,
  onValidateAll,
  onProcessShipments
}: ReviewActionButtonsProps) => {
  return (
    <div className="flex justify-center gap-4 pt-4">
      <Button 
        variant="outline" 
        onClick={onValidateAll}
        disabled={isValidating}
      >
        Re-validate All
      </Button>
      <Button 
        onClick={onProcessShipments}
        disabled={validationSummary.valid === 0 || isProcessing}
        className="bg-green-600 hover:bg-green-700"
      >
        {isProcessing ? 'Processing...' : `Process ${validationSummary.valid} Valid Shipments`}
      </Button>
    </div>
  );
};

export default ReviewActionButtons;
