
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shipment Details - {shipment.gbl_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-600">GBL Number</label>
                <p className="text-sm font-mono">{shipment.gbl_number}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Shipper Last Name</label>
                <p className="text-sm">{shipment.shipper_last_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Shipment Type</label>
                <div>
                  <Badge className={`${getShipmentTypeColor(shipment.shipment_type)} text-white capitalize`}>
                    {shipment.shipment_type}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">TSP</label>
                <p className="text-sm">{shipment.tsp?.scac_code} - {shipment.tsp?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dates</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Pickup Date</label>
                <p className="text-sm">{format(new Date(shipment.pickup_date), 'PPP')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Required Delivery Date</label>
                <p className="text-sm">{format(new Date(shipment.rdd), 'PPP')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-sm">{format(new Date(shipment.created_at), 'PPP')}</p>
              </div>

              {shipment.updated_at && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-sm">{format(new Date(shipment.updated_at), 'PPP')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Route Information</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Origin Rate Area</label>
                <p className="text-sm">{shipment.origin_rate_area}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Destination Rate Area</label>
                <p className="text-sm">{shipment.destination_rate_area}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Port of Embarkation (POE)</label>
                <p className="text-sm">{shipment.target_poe?.code} - {shipment.target_poe?.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Port of Debarkation (POD)</label>
                <p className="text-sm">{shipment.target_pod?.code} - {shipment.target_pod?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Volume & Pieces</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Estimated</label>
                  <div className="space-y-1">
                    <p className="text-sm">{shipment.estimated_pieces || '—'} pieces</p>
                    <p className="text-sm">{shipment.estimated_cube || '—'} ft³</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Actual</label>
                  <div className="space-y-1">
                    <p className="text-sm">{shipment.actual_pieces || '—'} pieces</p>
                    <p className="text-sm">{shipment.actual_cube || '—'} ft³</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Remaining</label>
                  <div className="space-y-1">
                    <p className="text-sm">{shipment.remaining_pieces || '—'} pieces</p>
                    <p className="text-sm">{shipment.remaining_cube || '—'} ft³</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {shipment.profiles && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Created By</h3>
              <div>
                <p className="text-sm">
                  {shipment.profiles.first_name} {shipment.profiles.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  {shipment.profiles.organizations?.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentViewDialog;
