
import { Button } from '@/components/ui/button';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { DateFieldGroup } from './DateFieldGroup';
import { VolumeFieldGroup } from './VolumeFieldGroup';
import { PortFieldGroup } from './PortFieldGroup';
import { BasicFields } from './BasicFields';
import { TspFieldGroup } from './TspFieldGroup';
import { useShipmentEditForm } from './hooks/useShipmentEditForm';

interface ShipmentEditFormProps {
  shipment: any;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

export const ShipmentEditForm = ({ shipment, onSubmit, onCancel }: ShipmentEditFormProps) => {
  const { rateAreas, ports, tsps } = useShipmentData();
  
  const {
    formData,
    pickupInputValue,
    rddInputValue,
    handleInputChange,
    handleDateInputChange,
    handleDateInputBlur,
    handleDateSelect,
  } = useShipmentEditForm(shipment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data on submit:', formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <BasicFields
          formData={formData}
          rateAreas={rateAreas || []}
          onInputChange={handleInputChange}
        />

        <TspFieldGroup
          formData={formData}
          tsps={tsps || []}
          onInputChange={handleInputChange}
        />

        <DateFieldGroup
          pickupInputValue={pickupInputValue}
          rddInputValue={rddInputValue}
          formData={formData}
          onDateInputChange={handleDateInputChange}
          onDateInputBlur={handleDateInputBlur}
          onDateSelect={handleDateSelect}
        />

        <PortFieldGroup
          formData={formData}
          ports={ports || []}
          onInputChange={handleInputChange}
        />

        <VolumeFieldGroup
          formData={formData}
          onInputChange={handleInputChange}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Shipment
        </Button>
      </div>
    </form>
  );
};
