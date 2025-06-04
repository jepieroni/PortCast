
import { mapShipmentType, parseAndValidateDate, parseAndValidateCube, validateCubeLogic } from './shipmentValidation';

export const validateRequiredFields = (record: any): string[] => {
  const errors: string[] = [];
  
  console.log('validateRequiredFields - Input record:', {
    gbl_number: record.gbl_number,
    shipment_type: record.shipment_type,
    shipper_last_name: record.shipper_last_name,
    origin_rate_area: record.origin_rate_area,
    destination_rate_area: record.destination_rate_area,
    raw_origin_rate_area: record.raw_origin_rate_area,
    raw_destination_rate_area: record.raw_destination_rate_area
  });
  
  // Validate GBL number
  if (!record.gbl_number || (typeof record.gbl_number === 'string' && record.gbl_number.trim() === '')) {
    errors.push('GBL number is required');
  }

  // Validate shipper last name
  if (!record.shipper_last_name || (typeof record.shipper_last_name === 'string' && record.shipper_last_name.trim() === '')) {
    errors.push('Shipper last name is required');
  }

  // Validate shipment type - be more specific about what we're checking
  if (!record.shipment_type) {
    console.log('validateRequiredFields - No shipment_type found');
    errors.push('Shipment type is required');
  } else if (typeof record.shipment_type === 'string' && record.shipment_type.trim() === '') {
    console.log('validateRequiredFields - Empty shipment_type string');
    errors.push('Shipment type is required');
  } else {
    const validTypes = ['inbound', 'outbound', 'intertheater', 'i', 'o', 't'];
    const shipmentType = String(record.shipment_type).toLowerCase().trim();
    console.log('validateRequiredFields - Checking shipment_type:', {
      original: record.shipment_type,
      normalized: shipmentType,
      validTypes: validTypes,
      isValid: validTypes.includes(shipmentType)
    });
    
    if (!validTypes.includes(shipmentType)) {
      errors.push('Invalid shipment type. Must be inbound, outbound, or intertheater');
    }
  }

  // Validate rate areas - check both translated and raw values
  const hasOriginRateArea = record.origin_rate_area || record.raw_origin_rate_area;
  const hasDestinationRateArea = record.destination_rate_area || record.raw_destination_rate_area;

  console.log('validateRequiredFields - Rate area check:', {
    origin_rate_area: record.origin_rate_area,
    raw_origin_rate_area: record.raw_origin_rate_area,
    hasOriginRateArea: hasOriginRateArea,
    destination_rate_area: record.destination_rate_area,
    raw_destination_rate_area: record.raw_destination_rate_area,
    hasDestinationRateArea: hasDestinationRateArea
  });

  if (!hasOriginRateArea || (typeof hasOriginRateArea === 'string' && hasOriginRateArea.trim() === '')) {
    errors.push('Origin rate area is required');
  }

  if (!hasDestinationRateArea || (typeof hasDestinationRateArea === 'string' && hasDestinationRateArea.trim() === '')) {
    errors.push('Destination rate area is required');
  }

  console.log('validateRequiredFields - Final errors:', errors);
  return errors;
};

export const validateDates = (record: any): string[] => {
  const errors: string[] = [];

  console.log('validateDates - Input record dates:', {
    pickup_date: record.pickup_date,
    pickup_date_type: typeof record.pickup_date,
    rdd: record.rdd,
    rdd_type: typeof record.rdd
  });

  // Validate pickup date - handle both ISO format and MM/DD/YY format
  const pickupDate = record.pickup_date || '';
  if (!pickupDate || pickupDate.trim() === '') {
    errors.push('Pickup date is required');
  } else {
    // Check if it's already in ISO format (YYYY-MM-DD)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDatePattern.test(pickupDate)) {
      console.log('validateDates - Pickup date is valid ISO format:', pickupDate);
      // If it's ISO format, it's valid - no additional validation needed
    } else {
      console.log('validateDates - Pickup date not ISO format, attempting to parse:', pickupDate);
      // If not ISO format, try to parse as MM/DD/YY
      const pickupResult = parseAndValidateDate(pickupDate, 'Pickup date');
      if (pickupResult.error) {
        errors.push(pickupResult.error);
      }
    }
  }

  // Validate RDD - handle both ISO format and MM/DD/YY format
  const rddDate = record.rdd || '';
  if (!rddDate || rddDate.trim() === '') {
    errors.push('Required delivery date is required');
  } else {
    // Check if it's already in ISO format (YYYY-MM-DD)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDatePattern.test(rddDate)) {
      console.log('validateDates - RDD is valid ISO format:', rddDate);
      // If it's ISO format, it's valid - no additional validation needed
    } else {
      console.log('validateDates - RDD not ISO format, attempting to parse:', rddDate);
      // If not ISO format, try to parse as MM/DD/YY
      const rddResult = parseAndValidateDate(rddDate, 'Required delivery date');
      if (rddResult.error) {
        errors.push(rddResult.error);
      }
    }
  }

  console.log('validateDates - Final errors:', errors);
  return errors;
};

export const validateCubeRequirements = (record: any): string[] => {
  const errors: string[] = [];

  // Handle cube values that might be numbers or strings
  const estimatedCube = record.estimated_cube;
  const actualCube = record.actual_cube;

  const hasEstimated = estimatedCube !== null && estimatedCube !== undefined && estimatedCube !== '' && Number(estimatedCube) > 0;
  const hasActual = actualCube !== null && actualCube !== undefined && actualCube !== '' && Number(actualCube) > 0;

  console.log('validateCubeRequirements - Cube validation debug:', {
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

  console.log('validateCubeRequirements - Final errors:', errors);
  return errors;
};
