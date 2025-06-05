
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BulkUploadRecord } from '../../hooks/utils/bulkUploadTypes';
import { RecordItem } from './RecordItem';

interface RecordsListProps {
  records: BulkUploadRecord[];
  onUpdateRecord: (recordId: string, updates: Partial<BulkUploadRecord>) => void;
}

export const RecordsList = ({ records, onUpdateRecord }: RecordsListProps) => {
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const handleEditToggle = (recordId: string) => {
    if (editingRecord === recordId) {
      setEditingRecord(null);
    } else {
      console.log('Starting edit for record:', recordId);
      setEditingRecord(recordId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {records.map((record) => (
            <RecordItem
              key={record.id}
              record={record}
              isEditing={editingRecord === record.id}
              onEditToggle={() => handleEditToggle(record.id)}
              onUpdateRecord={onUpdateRecord}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
