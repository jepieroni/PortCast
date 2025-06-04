
import { Button } from '@/components/ui/button';
import { ShipmentEditForm } from './ShipmentEditForm';

interface ShipmentEditModalProps {
  editingRecord: any;
  onEditComplete: (updatedData: any) => void;
  onCancel: () => void;
}

const ShipmentEditModal = ({
  editingRecord,
  onEditComplete,
  onCancel
}: ShipmentEditModalProps) => {
  if (!editingRecord) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingRecord.validation_status === 'invalid' ? 'Fix Errors' : 'Edit Details'} - {editingRecord.gbl_number}
        </h3>
        <ShipmentEditForm
          shipment={editingRecord}
          onSubmit={onEditComplete}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
};

export default ShipmentEditModal;
