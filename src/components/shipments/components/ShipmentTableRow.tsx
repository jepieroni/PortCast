
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
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
  onDelete: (shipmentId: string) => void;
}

const ShipmentTableRow = ({ shipment, onView, onEdit, onDelete }: ShipmentTableRowProps) => {
  const { isGlobalAdmin } = useAuth();

  return (
    <TableRow>
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
        {getCubeDisplayValue(shipment)}
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
            onClick={() => onView(shipment)}
            className="h-8 w-8 p-0"
          >
            <Eye size={14} />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEdit(shipment)}
            className="h-8 w-8 p-0"
          >
            <Edit size={14} />
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onDelete(shipment.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ShipmentTableRow;
