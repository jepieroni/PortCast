
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Shipment {
  id: string;
  gbl_number: string;
  shipper_last_name: string;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  shipment: Shipment | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog = ({ open, shipment, onConfirm, onCancel }: DeleteConfirmDialogProps) => {
  if (!shipment) return null;

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Shipment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete shipment <strong>{shipment.gbl_number}</strong> for{' '}
            <strong>{shipment.shipper_last_name}</strong>?
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Shipment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
