
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';

const ShipmentTableHeader = () => {
  const { isGlobalAdmin } = useAuth();

  return (
    <TableHeader>
      <TableRow>
        <TableHead>GBL Number</TableHead>
        <TableHead>Shipper</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Route</TableHead>
        <TableHead>Pickup Date</TableHead>
        <TableHead>RDD</TableHead>
        <TableHead>Cube Remaining</TableHead>
        {isGlobalAdmin && <TableHead>Organization</TableHead>}
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ShipmentTableHeader;
