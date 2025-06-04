
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
      
      // Comprehensive field mappings to catch various error message patterns
      const fieldMappings: Record<string, string[]> = {
        'gbl_number': ['gbl', 'number', 'gbl number'],
        'shipper_last_name': ['shipper', 'last name', 'shipper last name'],
        'shipment_type': ['shipment type', 'type', 'shipment_type'],
        'pickup_date': ['pickup', 'pickup date', 'pickup_date', 'pick up', 'pick-up'],
        'rdd': ['rdd', 'delivery', 'required delivery', 'delivery date', 'required delivery date'],
        'origin_rate_area': ['origin', 'origin rate', 'origin rate area', 'origin_rate_area'],
        'destination_rate_area': ['destination', 'destination rate', 'destination rate area', 'destination_rate_area'],
        'target_poe_id': ['poe', 'port of embarkation', 'embarkation', 'origin port'],
        'target_pod_id': ['pod', 'port of debarkation', 'debarkation', 'destination port'],
        'tsp_id': ['tsp', 'scac', 'transport', 'carrier'],
        'estimated_cube': ['estimated', 'estimated cube', 'cube'],
        'actual_cube': ['actual', 'actual cube', 'cube']
      };
      
      const keywords = fieldMappings[field.toLowerCase()] || [field.toLowerCase()];
      return keywords.some(keyword => {
        // Check if the keyword appears in the error message
        return errorLower.includes(keyword);
      });
    });
  };

  console.log('ShipmentEditForm - Form state:', {
    isInitialized,
    formData: {
      gbl_number: formData.gbl_number,
      shipment_type: formData.shipment_type,
      pickup_date: formData.pickup_date,
      rdd: formData.rdd,
      origin_rate_area: formData.origin_rate_area,
      destination_rate_area: formData.destination_rate_area,
      tsp_id: formData.tsp_id,
      target_poe_id: formData.target_poe_id,
      target_pod_id: formData.target_pod_id
    }
  });

  // Debug error highlighting
  if (isFixingErrors && validationErrors.length > 0) {
    console.log('ShipmentEditForm - Error highlighting debug:', {
      validationErrors,
      fieldErrorStates: {
        gbl_number: hasFieldError('gbl_number'),
        shipper_last_name: hasFieldError('shipper_last_name'),
        shipment_type: hasFieldError('shipment_type'),
        pickup_date: hasFieldError('pickup_date'),
        rdd: hasFieldError('rdd'),
        origin_rate_area: hasFieldError('origin_rate_area'),
        destination_rate_area: hasFieldError('destination_rate_area'),
        target_poe_id: hasFieldError('target_poe_id'),
        target_pod_id: hasFieldError('target_pod_id'),
        tsp_id: hasFieldError('tsp_id'),
        estimated_cube: hasFieldError('estimated_cube'),
        actual_cube: hasFieldError('actual_cube')
      }
    });
  }

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
