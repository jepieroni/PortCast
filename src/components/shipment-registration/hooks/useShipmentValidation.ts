
import { useToast } from '@/hooks/use-toast';
import { ShipmentFormData } from '../types';
import { validateGblNumber } from '../utils/shipmentUtils';
import { FieldError, FieldValidationResult } from './useFieldValidation';

export const useShipmentValidation = () => {
  const { toast } = useToast();

  const validateForm = (formData: ShipmentFormData): FieldValidationResult => {
    const errors: FieldError[] = [];

    // Validate required fields
    if (!formData.pickupDate) {
      errors.push({ field: 'pickupDate', message: 'Pickup Date is required' });
    }
    
    if (!formData.rdd) {
      errors.push({ field: 'rdd', message: 'Required Delivery Date is required' });
    }

    if (!formData.gblNumber) {
      errors.push({ field: 'gblNumber', message: 'GBL Number is required' });
    }

    if (!formData.shipperLastName) {
      errors.push({ field: 'shipperLastName', message: 'Shipper Last Name is required' });
    }

    if (!formData.shipmentType) {
      errors.push({ field: 'shipmentType', message: 'Shipment Type is required' });
    }

    if (!formData.tspId) {
      errors.push({ field: 'tspId', message: 'TSP is required' });
    }

    if (!formData.targetPoeId) {
      errors.push({ field: 'targetPoeId', message: 'Port of Embarkation is required' });
    }

    if (!formData.targetPodId) {
      errors.push({ field: 'targetPodId', message: 'Port of Debarkation is required' });
    }

    if (!formData.originRateArea) {
      errors.push({ field: 'originRateArea', message: 'Origin Rate Area is required' });
    }

    if (!formData.destinationRateArea) {
      errors.push({ field: 'destinationRateArea', message: 'Destination Rate Area is required' });
    }

    // Validate GBL number format if provided
    if (formData.gblNumber && !validateGblNumber(formData.gblNumber)) {
      errors.push({ 
        field: 'gblNumber', 
        message: 'GBL Number must be in format XXXX9999999 (4 letters followed by 7 digits)' 
      });
    }

    // Enhanced cube validation with pickup date logic
    const hasEstimated = formData.estimatedCube;
    const hasActual = formData.actualCube;
    
    // Check if pickup date is in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for comparison
    const pickupDate = formData.pickupDate ? new Date(formData.pickupDate) : null;
    const isPickupInFuture = pickupDate && pickupDate > today;

    if (hasEstimated && hasActual) {
      errors.push({ 
        field: 'estimatedCube', 
        message: 'Enter cube in EITHER estimated OR actual field, not both' 
      });
      errors.push({ 
        field: 'actualCube', 
        message: 'Enter cube in EITHER estimated OR actual field, not both' 
      });
    }

    if (!hasEstimated && !hasActual) {
      if (isPickupInFuture) {
        errors.push({ 
          field: 'estimatedCube', 
          message: 'Estimated cube is required when pickup date is in the future' 
        });
      } else {
        errors.push({ 
          field: 'estimatedCube', 
          message: 'Cube volume is required - enter in either estimated or actual field' 
        });
        errors.push({ 
          field: 'actualCube', 
          message: 'Cube volume is required - enter in either estimated or actual field' 
        });
      }
    }

    // New rule: If pickup date is in the future, only estimated cube is allowed
    if (isPickupInFuture && hasActual && !hasEstimated) {
      errors.push({ 
        field: 'actualCube', 
        message: 'Cannot use actual cube when pickup date is in the future - use estimated cube instead' 
      });
    }

    // Show toast for overall validation status
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fix ${errors.length} field error${errors.length > 1 ? 's' : ''} below.`,
        variant: "destructive",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstErrorField: errors.length > 0 ? errors[0].field : undefined
    };
  };

  return { validateForm };
};
