
import { useState } from 'react';
import { BulkUploadRecord } from '../../hooks/utils/bulkUploadTypes';
import { RecordItem } from './RecordItem';

interface RecordsListProps {
  records: BulkUploadRecord[];
  onUpdateRecord: (recordId: string, updates: Partial<BulkUploadRecord>) => void;
  onApproveWarnings?: (recordId: string, approvedWarningTypes: string[]) => void;
}

export const RecordsList = ({
  records,
  onUpdateRecord,
  onApproveWarnings
}: RecordsListProps) => {
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const handleEditToggle = (recordId: string) => {
    setEditingRecord(editingRecord === recordId ? null : recordId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Records ({records.length})</h3>
      <div className="space-y-3">
        {records.map((record) => (
          <RecordItem
            key={record.id}
            record={record}
            isEditing={editingRecord === record.id}
            onEditToggle={() => handleEditToggle(record.id)}
            onUpdateRecord={onUpdateRecord}
            onApproveWarnings={onApproveWarnings}
          />
        ))}
      </div>
    </div>
  );
};
