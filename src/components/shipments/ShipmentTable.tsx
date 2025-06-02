
import { useState } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { useShipmentActions } from '@/hooks/useShipmentActions';
import ShipmentEditDialog from './ShipmentEditDialog';
import ShipmentViewDialog from './ShipmentViewDialog';
import ShipmentTableHeader from './components/ShipmentTableHeader';
import ShipmentTableRow from './components/ShipmentTableRow';
import { ShipmentTableLoading, ShipmentTableError, ShipmentTableEmpty } from './components/ShipmentTableStates';

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
  remaining_cube: number;
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
  const { deleteShipment } = useShipmentActions();
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);

  const handleDelete = async (shipmentId: string) => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      await deleteShipment(shipmentId);
      onRefresh();
    }
  };

  if (isLoading) {
    return <ShipmentTableLoading />;
  }

  if (error) {
    return <ShipmentTableError error={error} onRetry={onRefresh} />;
  }

  if (!shipments || shipments.length === 0) {
    return <ShipmentTableEmpty />;
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <ShipmentTableHeader />
          <TableBody>
            {shipments.map((shipment) => (
              <ShipmentTableRow
                key={shipment.id}
                shipment={shipment}
                onView={setViewingShipment}
                onEdit={setEditingShipment}
                onDelete={handleDelete}
              />
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
