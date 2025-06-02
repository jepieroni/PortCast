
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

    // Validate pieces and volume logic
    const hasEstimated = formData.estimatedPieces || formData.estimatedCube;
    const hasActual = formData.actualPieces || formData.actualCube;

    if (hasEstimated && hasActual) {
      errors.push({ 
        field: 'estimatedPieces', 
        message: 'Enter values in EITHER estimated OR actual fields, not both' 
      });
      errors.push({ 
        field: 'actualPieces', 
        message: 'Enter values in EITHER estimated OR actual fields, not both' 
      });
    }

    if (!hasEstimated && !hasActual) {
      errors.push({ 
        field: 'estimatedPieces', 
        message: 'Enter both pieces and volume in either estimated or actual fields' 
      });
      errors.push({ 
        field: 'estimatedCube', 
        message: 'Enter both pieces and volume in either estimated or actual fields' 
      });
    }

    // Validate that both pieces and volume are provided for the chosen type
    if (hasEstimated && (!formData.estimatedPieces || !formData.estimatedCube)) {
      if (!formData.estimatedPieces) {
        errors.push({ field: 'estimatedPieces', message: 'Estimated pieces is required when using estimated values' });
      }
      if (!formData.estimatedCube) {
        errors.push({ field: 'estimatedCube', message: 'Estimated volume is required when using estimated values' });
      }
    }

    if (hasActual && (!formData.actualPieces || !formData.actualCube)) {
      if (!formData.actualPieces) {
        errors.push({ field: 'actualPieces', message: 'Actual pieces is required when using actual values' });
      }
      if (!formData.actualCube) {
        errors.push({ field: 'actualCube', message: 'Actual volume is required when using actual values' });
      }
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
