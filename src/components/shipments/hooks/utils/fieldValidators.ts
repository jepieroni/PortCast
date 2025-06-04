
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

  // Validate shipment type - accept the actual values stored in the database
  if (!record.shipment_type || (typeof record.shipment_type === 'string' && record.shipment_type.trim() === '')) {
    errors.push('Shipment type is required');
  } else {
    const validTypes = ['inbound', 'outbound', 'intertheater', 'i', 'o', 't'];
    const shipmentType = record.shipment_type.toLowerCase().trim();
    if (!validTypes.includes(shipmentType)) {
      errors.push('Invalid shipment type. Must be inbound, outbound, or intertheater');
    }
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

  // Validate pickup date - handle both ISO format and MM/DD/YY format
  const pickupDate = record.pickup_date || '';
  if (!pickupDate || pickupDate.trim() === '') {
    errors.push('Pickup date is required');
  } else {
    // Check if it's already in ISO format (YYYY-MM-DD)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDatePattern.test(pickupDate)) {
      // If not ISO format, try to parse as MM/DD/YY
      const pickupResult = parseAndValidateDate(pickupDate, 'Pickup date');
      if (pickupResult.error) {
        errors.push(pickupResult.error);
      }
    }
    // If it's ISO format, it's valid - no additional validation needed
  }

  // Validate RDD - handle both ISO format and MM/DD/YY format
  const rddDate = record.rdd || '';
  if (!rddDate || rddDate.trim() === '') {
    errors.push('Required delivery date is required');
  } else {
    // Check if it's already in ISO format (YYYY-MM-DD)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDatePattern.test(rddDate)) {
      // If not ISO format, try to parse as MM/DD/YY
      const rddResult = parseAndValidateDate(rddDate, 'Required delivery date');
      if (rddResult.error) {
        errors.push(rddResult.error);
      }
    }
    // If it's ISO format, it's valid - no additional validation needed
  }

  return errors;
};

export const validateCubeRequirements = (record: any): string[] => {
  const errors: string[] = [];

  // Handle cube values that might be numbers or strings
  const estimatedCube = record.estimated_cube;
  const actualCube = record.actual_cube;

  const hasEstimated = estimatedCube !== null && estimatedCube !== undefined && estimatedCube !== '' && Number(estimatedCube) > 0;
  const hasActual = actualCube !== null && actualCube !== undefined && actualCube !== '' && Number(actualCube) > 0;

  console.log('Cube validation debug:', {
    estimatedCube,
    actualCube,
    hasEstimated,
    hasActual,
    estimatedType: typeof estimatedCube,
    actualType: typeof actualCube
  });

  if (!hasEstimated && !hasActual) {
    errors.push('Either estimated cube or actual cube is required');
  } else if (hasEstimated && hasActual) {
    errors.push('Cannot have both estimated and actual cube - choose one based on pickup date');
  }

  return errors;
};
