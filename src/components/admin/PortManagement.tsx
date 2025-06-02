
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePortManagement } from './hooks/usePortManagement';
import PortForm from './components/PortForm';
import PortList from './components/PortList';

interface PortManagementProps {
  onBack: () => void;
}

const PortManagement = ({ onBack }: PortManagementProps) => {
  const {
    ports,
    rateAreas,
    portRegions,
    editingPort,
    formData,
    setFormData,
    getPortRegion,
    refreshData,
    handleSubmit,
    handleEdit,
    handleDelete,
    cancelEdit
  } = usePortManagement();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Admin Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Port Management</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <PortForm
          editingPort={editingPort}
          formData={formData}
          setFormData={setFormData}
          rateAreas={rateAreas}
          portRegions={portRegions}
          handleSubmit={handleSubmit}
          cancelEdit={cancelEdit}
          refreshData={refreshData}
        />

        <PortList
          ports={ports}
          getPortRegion={getPortRegion}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default PortManagement;
