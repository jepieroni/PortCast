
import { mapShipmentType, parseAndValidateDate, parseAndValidateCube, validateCubeLogic } from './shipmentValidation';

export const validateRequiredFields = (record: any): string[] => {
  const errors: string[] = [];
  
  // Validate GBL number
  if (!record.gbl_number || (typeof record.gbl_number === 'string' && record.gbl_number.trim() === '')) {
    errors.push('GBL number is required');
  }

  // Validate shipper last name
  if (!record.shipper_last_name || (typeof record.shipper_last_name === 'string' && record.shipper_last_name.trim() === '')) {
    errors.push('Shipper last name is required');
  }

  // Validate shipment type with improved logic
  const shipmentTypeResult = mapShipmentType(record.shipment_type || '');
  if (!shipmentTypeResult.isValid) {
    errors.push('Invalid or missing shipment type. Use inbound/outbound/intertheater');
  }

  // Validate rate areas
  if (!record.origin_rate_area || (typeof record.origin_rate_area === 'string' && record.origin_rate_area.trim() === '')) {
    errors.push('Origin rate area is required');
  }

  if (!record.destination_rate_area || (typeof record.destination_rate_area === 'string' && record.destination_rate_area.trim() === '')) {
    errors.push('Destination rate area is required');
  }

  return errors;
};

export const validateDates = (record: any): string[] => {
  const errors: string[] = [];

  // Validate pickup date
  const pickupResult = parseAndValidateDate(record.pickup_date || '', 'Pickup date');
  if (pickupResult.error) {
    errors.push(pickupResult.error);
  }

  // Validate RDD
  const rddResult = parseAndValidateDate(record.rdd || '', 'Required delivery date');
  if (rddResult.error) {
    errors.push(rddResult.error);
  }

  return errors;
};

export const validateCubeRequirements = (record: any): string[] => {
  const errors: string[] = [];

  // Parse cube values
  const estimatedResult = parseAndValidateCube(record.estimated_cube || '', 'estimated cube');
  const actualResult = parseAndValidateCube(record.actual_cube || '', 'actual cube');

  if (record.estimated_cube && estimatedResult.error) {
    errors.push(estimatedResult.error);
  }

  if (record.actual_cube && actualResult.error) {
    errors.push(actualResult.error);
  }

  // Validate cube logic if we have a valid pickup date
  const pickupResult = parseAndValidateDate(record.pickup_date || '', 'Pickup date');
  if (pickupResult.parsedDate) {
    const pickupDate = new Date(pickupResult.parsedDate);
    const cubeErrors = validateCubeLogic(estimatedResult.parsedCube, actualResult.parsedCube, pickupDate);
    errors.push(...cubeErrors);
  } else {
    // If pickup date is invalid, we still need basic cube validation
    const hasEstimated = estimatedResult.parsedCube !== null && estimatedResult.parsedCube > 0;
    const hasActual = actualResult.parsedCube !== null && actualResult.parsedCube > 0;
    
    if (!hasEstimated && !hasActual) {
      errors.push('Either estimated cube or actual cube is required');
    } else if (hasEstimated && hasActual) {
      errors.push('Cannot have both estimated and actual cube - choose one based on pickup date');
    }
  }

  return errors;
};
