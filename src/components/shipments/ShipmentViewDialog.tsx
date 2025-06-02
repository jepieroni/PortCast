
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ShipmentViewDialogProps {
  shipment: any;
  onClose: () => void;
}

const ShipmentViewDialog = ({ shipment, onClose }: ShipmentViewDialogProps) => {
  const getShipmentTypeColor = (type: string) => {
    switch (type) {
      case 'inbound': return 'bg-blue-500';
      case 'outbound': return 'bg-green-500';
      case 'intertheater': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Shipment Details - {shipment.gbl_number}
            <Badge className={`${getShipmentTypeColor(shipment.shipment_type)} text-white capitalize`}>
              {shipment.shipment_type}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">GBL Number:</span> {shipment.gbl_number}</div>
                <div><span className="font-medium">Shipper:</span> {shipment.shipper_last_name}</div>
                <div><span className="font-medium">Type:</span> {shipment.shipment_type}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Dates</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Pickup Date:</span> {format(new Date(shipment.pickup_date), 'MMM dd, yyyy')}</div>
                <div><span className="font-medium">Required Delivery:</span> {format(new Date(shipment.rdd), 'MMM dd, yyyy')}</div>
                <div><span className="font-medium">Created:</span> {format(new Date(shipment.created_at), 'MMM dd, yyyy')}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Route</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Origin:</span> {shipment.origin_rate_area}</div>
                <div><span className="font-medium">Destination:</span> {shipment.destination_rate_area}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Volume & Pieces</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Estimated Cube:</span> {shipment.estimated_cube} ft³</div>
                <div><span className="font-medium">Actual Cube:</span> {shipment.actual_cube || 'Not set'} ft³</div>
                <div><span className="font-medium">Estimated Pieces:</span> {shipment.estimated_pieces}</div>
                <div><span className="font-medium">Actual Pieces:</span> {shipment.actual_pieces || 'Not set'}</div>
              </div>
            </div>
          </div>

          {shipment.profiles && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Created By</h3>
              <div className="text-sm">
                <div><span className="font-medium">User:</span> {shipment.profiles.first_name} {shipment.profiles.last_name}</div>
                {shipment.profiles.organizations && (
                  <div><span className="font-medium">Organization:</span> {shipment.profiles.organizations.name}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentViewDialog;
