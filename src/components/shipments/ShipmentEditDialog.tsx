
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useShipmentActions } from '@/hooks/useShipmentActions';
import { ShipmentEditForm } from './components/ShipmentEditForm';

interface ShipmentEditDialogProps {
  shipment: any;
  onClose: () => void;
  onSuccess: () => void;
}

const ShipmentEditDialog = ({ shipment, onClose, onSuccess }: ShipmentEditDialogProps) => {
  const { updateShipment } = useShipmentActions();

  const handleFormSubmit = async (formData: any) => {
    try {
      await updateShipment(shipment.id, formData);
      onSuccess();
    } catch (error) {
      console.error('Error updating shipment:', error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose} modal={true}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Prevent dialog from stealing focus initially
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          // Prevent dialog from managing focus on close
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Shipment - {shipment?.gbl_number}</DialogTitle>
        </DialogHeader>

        <ShipmentEditForm
          shipment={shipment}
          onSubmit={handleFormSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentEditDialog;
