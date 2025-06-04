
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
  validationErrors?: string[];
  isFixingErrors?: boolean;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

export const ShipmentEditForm = ({ 
  shipment, 
  validationErrors = [], 
  isFixingErrors = false, 
  onSubmit, 
  onCancel 
}: ShipmentEditFormProps) => {
  console.log('ShipmentEditForm - Rendered with shipment:', shipment?.gbl_number);
  console.log('ShipmentEditForm - Validation errors:', validationErrors);
  console.log('ShipmentEditForm - Is fixing errors:', isFixingErrors);
  
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

  // Helper function to check if a field has validation errors
  const hasFieldError = (field: string): boolean => {
    if (!isFixingErrors || !validationErrors.length) return false;
    
    return validationErrors.some(error => {
      const errorLower = error.toLowerCase();
      const fieldLower = field.toLowerCase();
      
      // Map form field names to potential error keywords
      const fieldMappings: Record<string, string[]> = {
        'gbl_number': ['gbl', 'number'],
        'shipper_last_name': ['shipper', 'last name'],
        'shipment_type': ['shipment type', 'type'],
        'pickup_date': ['pickup', 'date'],
        'rdd': ['rdd', 'delivery'],
        'origin_rate_area': ['origin', 'rate area'],
        'destination_rate_area': ['destination', 'rate area'],
        'target_poe_id': ['poe', 'port of embarkation'],
        'target_pod_id': ['pod', 'port of debarkation'],
        'tsp_id': ['tsp', 'scac'],
        'estimated_cube': ['estimated', 'cube'],
        'actual_cube': ['actual', 'cube']
      };
      
      const keywords = fieldMappings[fieldLower] || [fieldLower];
      return keywords.some(keyword => errorLower.includes(keyword));
    });
  };

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
          hasFieldError={hasFieldError}
        />

        <TspFieldGroup
          formData={formData}
          tsps={tsps || []}
          onInputChange={handleInputChange}
          hasFieldError={hasFieldError}
        />

        <DateFieldGroup
          pickupInputValue={pickupInputValue}
          rddInputValue={rddInputValue}
          formData={formData}
          onDateInputChange={handleDateInputChange}
          onDateInputBlur={handleDateInputBlur}
          onDateSelect={handleDateSelect}
          hasFieldError={hasFieldError}
        />

        <PortFieldGroup
          formData={formData}
          ports={ports || []}
          onInputChange={handleInputChange}
          hasFieldError={hasFieldError}
        />

        <VolumeFieldGroup
          formData={formData}
          onInputChange={handleInputChange}
          hasFieldError={hasFieldError}
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
