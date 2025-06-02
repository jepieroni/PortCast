
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import ShipmentTable from './shipments/ShipmentTable';
import ShipmentFilters from './shipments/ShipmentFilters';
import { useShipments } from '@/hooks/useShipments';

interface ShipmentsDashboardProps {
  onBack: () => void;
  onAddShipment: () => void;
}

const ShipmentsDashboard = ({ onBack, onAddShipment }: ShipmentsDashboardProps) => {
  const [filters, setFilters] = useState({
    search: '',
    shipmentType: '',
    dateFrom: '',
    dateTo: '',
  });

  const { data: shipments, isLoading, error, refetch } = useShipments(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold">Shipments Management</h2>
        </div>
        
        <Button 
          onClick={onAddShipment}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Add Shipment
        </Button>
      </div>

      <ShipmentFilters filters={filters} onFiltersChange={setFilters} />

      <ShipmentTable 
        shipments={shipments || []}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
      />
    </div>
  );
};

export default ShipmentsDashboard;
