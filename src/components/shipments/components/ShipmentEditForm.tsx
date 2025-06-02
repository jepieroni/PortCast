
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
  console.log('ShipmentEditForm - Rendered with shipment:', shipment?.gbl_number);
  
  const { rateAreas, ports, tsps } = useShipmentData();
  console.log('ShipmentEditForm - Data loaded:', { 
    rateAreasCount: rateAreas?.length, 
    portsCount: ports?.length, 
    tspsCount: tsps?.length 
  });
  
  const {
    formData,
    pickupInputValue,
    rddInputValue,
    isInitialized,
    handleInputChange,
    handleDateInputChange,
    handleDateInputBlur,
    handleDateSelect,
  } = useShipmentEditForm(shipment);

  console.log('ShipmentEditForm - Form state:', {
    isInitialized,
    formData: {
      gbl_number: formData.gbl_number,
      origin_rate_area: formData.origin_rate_area,
      destination_rate_area: formData.destination_rate_area,
      tsp_id: formData.tsp_id,
      target_poe_id: formData.target_poe_id,
      target_pod_id: formData.target_pod_id
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ShipmentEditForm - Form submitted with data:', formData);
    onSubmit(formData);
  };

  // Don't render the form until data is initialized to prevent flash of empty fields
  if (!isInitialized) {
    console.log('ShipmentEditForm - Not initialized yet, showing loading state');
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading form data...</div>
      </div>
    );
  }

  console.log('ShipmentEditForm - Rendering initialized form');

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
