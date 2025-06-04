import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BulkUploadHeaderProps {
  validationSummary: {
    valid: number;
    invalid: number;
    pending: number;
  };
  isProcessing: boolean;
  onBack: () => void;
  onProcessShipments: () => void;
}

const BulkUploadHeader = ({
  validationSummary,
  isProcessing,
  onBack,
  onProcessShipments
}: BulkUploadHeaderProps) => {
  const hasValidShipments = validationSummary.valid > 0;

  const handleBackClick = () => {
    // If there are valid shipments, the AlertDialog will handle this
    // Otherwise, go back directly
    if (!hasValidShipments) {
      onBack();
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {hasValidShipments ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <ArrowLeft size={16} className="mr-2" />
                Back to Upload
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Upload Review?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have {validationSummary.valid} validated shipment{validationSummary.valid !== 1 ? 's' : ''} ready to be processed. 
                  If you go back now, you'll lose this progress and need to upload again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <AlertDialogCancel className="w-full sm:w-auto">Stay on Page</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onProcessShipments}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  {isProcessing ? 'Processing...' : `Process ${validationSummary.valid} Shipments`}
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={onBack}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                >
                  Leave Without Processing
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button variant="outline" onClick={handleBackClick}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Upload
          </Button>
        )}
        <h2 className="text-2xl font-bold">Review Upload</h2>
      </div>
    </div>
  );
};

export default BulkUploadHeader;
