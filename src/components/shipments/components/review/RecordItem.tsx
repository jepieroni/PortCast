
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkUploadRecord } from '../../hooks/utils/bulkUploadTypes';
import { RecordEditForm } from './RecordEditForm';

interface RecordItemProps {
  record: BulkUploadRecord;
  isEditing: boolean;
  onEditToggle: () => void;
  onUpdateRecord: (recordId: string, updates: Partial<BulkUploadRecord>) => void;
}

export const RecordItem = ({
  record,
  isEditing,
  onEditToggle,
  onUpdateRecord
}: RecordItemProps) => {
  const handleFieldChange = (field: string, value: string) => {
    console.log(`Updating field ${field} to value:`, value);
    onUpdateRecord(record.id, { [field]: value });
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={record.status === 'valid' ? 'default' : 'destructive'}>
            {record.status}
          </Badge>
          <span className="font-medium">{record.gbl_number}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditToggle}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {record.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
          <div className="text-sm text-red-800">
            <strong>Errors:</strong>
            <ul className="list-disc list-inside mt-1">
              {record.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isEditing ? (
        <RecordEditForm
          record={record}
          onFieldChange={handleFieldChange}
        />
      ) : (
        <div className="text-sm text-gray-600">
          {record.shipper_last_name} • {record.shipment_type} • {record.pickup_date}
        </div>
      )}
    </div>
  );
};
