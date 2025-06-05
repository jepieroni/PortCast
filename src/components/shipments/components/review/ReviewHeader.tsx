
import { Button } from '@/components/ui/button';

interface ReviewHeaderProps {
  onBack: () => void;
  onProcess: () => void;
  validCount: number;
  isProcessing: boolean;
}

export const ReviewHeader = ({
  onBack,
  onProcess,
  validCount,
  isProcessing
}: ReviewHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="text-2xl font-bold">Review Upload</h2>
      </div>
      <Button
        onClick={onProcess}
        disabled={validCount === 0 || isProcessing}
        className="bg-green-600 hover:bg-green-700"
      >
        {isProcessing ? 'Processing...' : `Process ${validCount} Valid Records`}
      </Button>
    </div>
  );
};
