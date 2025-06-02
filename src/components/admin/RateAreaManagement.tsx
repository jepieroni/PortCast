
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRateAreaManagement } from './hooks/useRateAreaManagement';
import RateAreaForm from './components/RateAreaForm';
import RateAreaList from './components/RateAreaList';

interface RateAreaManagementProps {
  onBack: () => void;
}

const RateAreaManagement = ({ onBack }: RateAreaManagementProps) => {
  const {
    rateAreas,
    portRegions,
    countries,
    editingRateArea,
    formData,
    setFormData,
    getRateAreaRegion,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancel
  } = useRateAreaManagement();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Admin Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Rate Area Management</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RateAreaForm
          formData={formData}
          setFormData={setFormData}
          editingRateArea={editingRateArea}
          countries={countries}
          portRegions={portRegions}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        <RateAreaList
          rateAreas={rateAreas}
          getRateAreaRegion={getRateAreaRegion}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default RateAreaManagement;
