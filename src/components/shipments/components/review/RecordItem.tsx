
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BulkUploadRecord } from '../../hooks/utils/bulkUploadTypes';
import { RecordEditForm } from './RecordEditForm';
import { WarningApprovalDialog } from './WarningApprovalDialog';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

interface RecordItemProps {
  record: BulkUploadRecord;
  isEditing: boolean;
  onEditToggle: () => void;
  onUpdateRecord: (recordId: string, updates: Partial<BulkUploadRecord>) => void;
  onApproveWarnings?: (recordId: string, approvedWarningTypes: string[]) => void;
}

export const RecordItem = ({
  record,
  isEditing,
  onEditToggle,
  onUpdateRecord,
  onApproveWarnings
}: RecordItemProps) => {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  
  console.log(`🔍 RECORD ITEM: Rendering badge for ${record.gbl_number} with status: ${record.status}`);
  
  const handleFieldChange = (field: string, value: string) => {
    console.log(`Updating field ${field} to value:`, value);
    onUpdateRecord(record.id, { [field]: value });
  };

  const handleApproveWarnings = (approvedWarningTypes: string[]) => {
    if (onApproveWarnings) {
      onApproveWarnings(record.id, approvedWarningTypes);
    }
  };

  const renderStatusBadge = () => {
    console.log(`🔍 RECORD ITEM: Rendering status badge for status: ${record.status}`);
    
    if (record.status === 'valid') {
      return (
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-green-500 text-white hover:bg-green-600 border-green-500">
          <CheckCircle size={12} className="mr-1" />
          Valid
        </span>
      );
    } else if (record.status === 'warning') {
      return (
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500">
          <AlertTriangle size={12} className="mr-1" />
          Warning
        </span>
      );
    } else if (record.status === 'invalid') {
      return (
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-red-500 text-white hover:bg-red-600 border-red-500">
          <XCircle size={12} className="mr-1" />
          Invalid
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-gray-500 text-white hover:bg-gray-600 border-gray-500">
          Unknown
        </span>
      );
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          <span className="font-medium">{record.gbl_number}</span>
        </div>
        <div className="flex gap-2">
          {record.status === 'warning' && record.warnings && record.warnings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWarningDialog(true)}
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              <Eye size={14} className="mr-1" />
              Review Warnings
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onEditToggle}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
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

      {record.warnings && record.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
          <div className="text-sm text-yellow-800">
            <strong>Warnings:</strong>
            <ul className="list-disc list-inside mt-1">
              {record.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
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

      <WarningApprovalDialog
        open={showWarningDialog}
        onOpenChange={setShowWarningDialog}
        warnings={record.warnings || []}
        onApprove={handleApproveWarnings}
        gblNumber={record.gbl_number}
      />
    </div>
  );
};
