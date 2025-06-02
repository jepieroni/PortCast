
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getShipmentTypeColor, getCubeDisplayValue } from '../utils/shipmentTableUtils';

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

interface ShipmentTableRowProps {
  shipment: Shipment;
  onView: (shipment: Shipment) => void;
  onEdit: (shipment: Shipment) => void;
  onDelete: (shipment: Shipment) => void;
}

const ShipmentTableRow = ({ shipment, onView, onEdit, onDelete }: ShipmentTableRowProps) => {
  const { isGlobalAdmin } = useAuth();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{shipment.gbl_number}</TableCell>
      <TableCell>{shipment.shipper_last_name}</TableCell>
      <TableCell>
        <Badge className={`text-white ${getShipmentTypeColor(shipment.shipment_type)}`}>
          {shipment.shipment_type}
        </Badge>
      </TableCell>
      <TableCell>
        {shipment.origin_rate_area} → {shipment.destination_rate_area}
      </TableCell>
      <TableCell>{formatDate(shipment.pickup_date)}</TableCell>
      <TableCell>{formatDate(shipment.rdd)}</TableCell>
      <TableCell>{getCubeDisplayValue(shipment)}</TableCell>
      {isGlobalAdmin && (
        <TableCell>
          {shipment.profiles?.organizations?.name || 'Unknown'}
        </TableCell>
      )}
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(shipment)}
          >
            <Eye size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(shipment)}
          >
            <Edit size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(shipment)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ShipmentTableRow;
