
import { BulkUploadRecord } from '../hooks/utils/bulkUploadTypes';
import { ReviewHeader } from './review/ReviewHeader';
import { SummaryCards } from './review/SummaryCards';
import { RecordsList } from './review/RecordsList';

interface NewBulkUploadReviewProps {
  records: BulkUploadRecord[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
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
      />
    </div>
  );
};
