
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useShipmentActions } from '@/hooks/useShipmentActions';
import ShipmentEditDialog from './ShipmentEditDialog';
import ShipmentViewDialog from './ShipmentViewDialog';
import { format } from 'date-fns';

interface Shipment {
  id: string;
  gbl_number: string;
  shipper_last_name: string;
  shipment_type: 'inbound' | 'outbound' | 'intertheater';
  origin_rate_area: string;
  destination_rate_area: string;
  pickup_date: string;
  rdd: string;
  actual_cube: number;
  estimated_cube: number;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    organizations: {
      name: string;
    };
  };
}

interface ShipmentTableProps {
  shipments: Shipment[];
  isLoading: boolean;
  error: any;
  onRefresh: () => void;
}

const ShipmentTable = ({ shipments, isLoading, error, onRefresh }: ShipmentTableProps) => {
  const { isGlobalAdmin } = useAuth();
  const { deleteShipment } = useShipmentActions();
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);

  const handleDelete = async (shipmentId: string) => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      await deleteShipment(shipmentId);
      onRefresh();
    }
  };

  const getShipmentTypeColor = (type: string) => {
    switch (type) {
      case 'inbound': return 'bg-blue-500';
      case 'outbound': return 'bg-green-500';
      case 'intertheater': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading shipments</p>
        <p className="text-gray-500">{error.message}</p>
        <Button onClick={onRefresh} className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (!shipments || shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No shipments found</p>
        <p className="text-gray-400">Add some shipments to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GBL Number</TableHead>
              <TableHead>Shipper</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Pickup Date</TableHead>
              <TableHead>RDD</TableHead>
              <TableHead>Cube (Actual/Est.)</TableHead>
              {isGlobalAdmin && <TableHead>Organization</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell className="font-medium">{shipment.gbl_number}</TableCell>
                <TableCell>{shipment.shipper_last_name}</TableCell>
                <TableCell>
                  <Badge className={`${getShipmentTypeColor(shipment.shipment_type)} text-white capitalize`}>
                    {shipment.shipment_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {shipment.origin_rate_area} → {shipment.destination_rate_area}
                </TableCell>
                <TableCell>{format(new Date(shipment.pickup_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(new Date(shipment.rdd), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  {shipment.actual_cube || shipment.estimated_cube} ft³
                  {shipment.actual_cube && shipment.estimated_cube && (
                    <span className="text-gray-500 text-xs block">
                      Est: {shipment.estimated_cube} ft³
                    </span>
                  )}
                </TableCell>
                {isGlobalAdmin && (
                  <TableCell className="text-sm">
                    {shipment.profiles?.organizations?.name || 'Unknown'}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setViewingShipment(shipment)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingShipment(shipment)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(shipment.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingShipment && (
        <ShipmentEditDialog
          shipment={editingShipment}
          onClose={() => setEditingShipment(null)}
          onSuccess={() => {
            setEditingShipment(null);
            onRefresh();
          }}
        />
      )}

      {viewingShipment && (
        <ShipmentViewDialog
          shipment={viewingShipment}
          onClose={() => setViewingShipment(null)}
        />
      )}
    </>
  );
};

export default ShipmentTable;
