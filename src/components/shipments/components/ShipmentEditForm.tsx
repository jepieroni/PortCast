
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

  // Helper function to check if a field has validation errors - more precise matching
  const hasFieldError = (field: string): boolean => {
    if (!isFixingErrors || !validationErrors.length) return false;
    
    return validationErrors.some(error => {
      const errorLower = error.toLowerCase();
      
      // Very specific field error matching to avoid false positives
      switch (field.toLowerCase()) {
        case 'gbl_number':
          return errorLower.includes('gbl number') || errorLower.includes('gbl_number');
        
        case 'shipper_last_name':
          return errorLower.includes('shipper last name') || errorLower.includes('shipper_last_name');
        
        case 'shipment_type':
          return (errorLower.includes('shipment type') || errorLower.includes('shipment_type')) &&
                 !errorLower.includes('rate area') && !errorLower.includes('port') && !errorLower.includes('tsp');
        
        case 'pickup_date':
          return errorLower.includes('pickup date') || errorLower.includes('pickup_date');
        
        case 'rdd':
          return (errorLower.includes('rdd') || errorLower.includes('delivery date') || errorLower.includes('required delivery')) &&
                 !errorLower.includes('rate area');
        
        case 'origin_rate_area':
          return errorLower.includes('origin rate area') || errorLower.includes('origin_rate_area');
        
        case 'destination_rate_area':
          return errorLower.includes('destination rate area') || errorLower.includes('destination_rate_area');
        
        case 'target_poe_id':
          return errorLower.includes('poe') || errorLower.includes('port of embarkation') || errorLower.includes('origin port');
        
        case 'target_pod_id':
          return errorLower.includes('pod') || errorLower.includes('port of debarkation') || errorLower.includes('destination port');
        
        case 'tsp_id':
          return (errorLower.includes('tsp') || errorLower.includes('scac') || errorLower.includes('transport') || errorLower.includes('carrier')) &&
                 !errorLower.includes('rate area') && !errorLower.includes('port');
        
        case 'estimated_cube':
          return errorLower.includes('estimated cube') || errorLower.includes('estimated_cube');
        
        case 'actual_cube':
          return errorLower.includes('actual cube') || errorLower.includes('actual_cube');
        
        default:
          return false;
      }
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
