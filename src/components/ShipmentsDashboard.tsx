
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import ShipmentTable from './shipments/ShipmentTable';
import ShipmentFilters from './shipments/ShipmentFilters';
import BulkShipmentUpload from './shipments/BulkShipmentUpload';
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
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const { data: shipments, isLoading, error, refetch } = useShipments(filters);

  const handleBulkUploadClick = () => {
    console.log('Bulk upload button clicked');
    setShowBulkUpload(true);
  };

  const handleBulkUploadBack = () => {
    console.log('Returning from bulk upload');
    setShowBulkUpload(false);
    // Refresh shipments data when returning from bulk upload
    refetch();
  };

  if (showBulkUpload) {
    return (
      <BulkShipmentUpload onBack={handleBulkUploadBack} />
    );
  }

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
        
        <div className="flex gap-2">
          <Button 
            onClick={handleBulkUploadClick}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </Button>
          <Button 
            onClick={onAddShipment}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Shipment
          </Button>
        </div>
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
