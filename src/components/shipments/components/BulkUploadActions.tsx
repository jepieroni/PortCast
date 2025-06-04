
import { Button } from '@/components/ui/button';

interface BulkUploadActionsProps {
  validationSummary: {
    valid: number;
    invalid: number;
    pending: number;
  };
  isProcessing: boolean;
  onProcessShipments: () => void;
}

const BulkUploadActions = ({
  validationSummary,
  isProcessing,
  onProcessShipments
}: BulkUploadActionsProps) => {
  return (
    <div className="flex justify-end gap-4">
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

export default BulkUploadActions;
