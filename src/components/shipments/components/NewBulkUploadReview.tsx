
import { BulkUploadRecord } from '../hooks/utils/bulkUploadTypes';
import { ReviewHeader } from './review/ReviewHeader';
import { SummaryCards } from './review/SummaryCards';
import { RecordsList } from './review/RecordsList';
import { approveWarnings } from '../hooks/utils/stagingRecordsUpdater';
import { useToast } from '@/hooks/use-toast';

interface NewBulkUploadReviewProps {
  records: BulkUploadRecord[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    warning: number;
    pending: number;
  };
  onUpdateRecord: (recordId: string, updates: Partial<BulkUploadRecord>) => void;
  onProcess: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export const NewBulkUploadReview = ({
  records,
  summary,
  onUpdateRecord,
  onProcess,
  onBack,
  isProcessing
}: NewBulkUploadReviewProps) => {
  const { toast } = useToast();

  const handleApproveWarnings = async (recordId: string, approvedWarningTypes: string[]) => {
    try {
      console.log(`Approving warnings for record ${recordId}:`, approvedWarningTypes);
      
      // Update the staging record with approved warnings
      await approveWarnings(recordId, approvedWarningTypes);
      
      // Update the local record to reflect the changes
      onUpdateRecord(recordId, {
        approved_warnings: approvedWarningTypes,
        status: 'valid' // Will be set correctly by the validation logic
      });

      toast({
        title: "Warnings Approved",
        description: `${approvedWarningTypes.length} warning(s) have been approved for this record.`,
      });
    } catch (error) {
      console.error('Error approving warnings:', error);
      toast({
        title: "Error",
        description: "Failed to approve warnings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <ReviewHeader
        onBack={onBack}
        onProcess={onProcess}
        validCount={summary.valid}
        isProcessing={isProcessing}
      />

      <SummaryCards summary={summary} />

      <RecordsList
        records={records}
        onUpdateRecord={onUpdateRecord}
        onApproveWarnings={handleApproveWarnings}
      />
    </div>
  );
};
