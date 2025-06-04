import { mapShipmentType, parseAndValidateDate, parseAndValidateCube, validateCubeLogic } from './shipmentValidation';
import type { ParsedRow } from './csvParser';

export const validateRow = (row: ParsedRow): ParsedRow => {
  // Validate GBL number
  if (!row.gbl_number || (typeof row.gbl_number === 'string' && row.gbl_number.trim() === '')) {
    row._validation_errors.push('GBL number is required');
  }

  // Validate shipper last name
  if (!row.shipper_last_name || (typeof row.shipper_last_name === 'string' && row.shipper_last_name.trim() === '')) {
    row._validation_errors.push('Shipper last name is required');
  }

  // Validate and map shipment type - mark as invalid but don't set to null
  const shipmentTypeResult = mapShipmentType(row.shipment_type || '');
  if (!shipmentTypeResult.isValid) {
    row._validation_errors.push('Invalid or missing shipment type. Use I/O/T or inbound/outbound/intertheater');
    // Keep the original invalid value or set to 'invalid' - don't set to null
    row.shipment_type = row.shipment_type || 'invalid';
  } else {
    // Only update if valid
    row.shipment_type = shipmentTypeResult.mappedType;
  }

  // Validate required text fields
  const requiredTextFields = [
    { field: 'origin_rate_area', name: 'Origin rate area' },
    { field: 'destination_rate_area', name: 'Destination rate area' },
    { field: 'poe_code', name: 'POE code' },
    { field: 'pod_code', name: 'POD code' },
    { field: 'scac_code', name: 'SCAC code' }
  ];

  requiredTextFields.forEach(({ field, name }) => {
    if (!row[field] || (typeof row[field] === 'string' && row[field].trim() === '')) {
      row._validation_errors.push(`${name} is required`);
    }
  });

  // Validate dates - mark as invalid but use sentinel dates instead of null
  const pickupResult = parseAndValidateDate(row.pickup_date || '', 'Pickup date');
  const rddResult = parseAndValidateDate(row.rdd || '', 'Required delivery date');

  if (pickupResult.error) {
    row._validation_errors.push(pickupResult.error);
    row.parsed_pickup_date = '1900-01-01'; // Sentinel date instead of null
  } else {
    row.parsed_pickup_date = pickupResult.parsedDate;
  }

  if (rddResult.error) {
    row._validation_errors.push(rddResult.error);
    row.parsed_rdd = '1900-01-01'; // Sentinel date instead of null
  } else {
    row.parsed_rdd = rddResult.parsedDate;
  }

  // Validate cube fields - MUST BE VALID if provided
  const estimatedResult = parseAndValidateCube(row.estimated_cube || '', 'estimated cube');
  const actualResult = parseAndValidateCube(row.actual_cube || '', 'actual cube');

  if (row.estimated_cube && estimatedResult.error) {
    row._validation_errors.push(estimatedResult.error);
    row.parsed_estimated_cube = null; // These can be null since they're nullable in staging
  } else {
    row.parsed_estimated_cube = estimatedResult.parsedCube;
  }

  if (row.actual_cube && actualResult.error) {
    row._validation_errors.push(actualResult.error);
    row.parsed_actual_cube = null; // These can be null since they're nullable in staging
  } else {
    row.parsed_actual_cube = actualResult.parsedCube;
  }

  // Validate cube logic only if we have a valid pickup date
  if (pickupResult.parsedDate) {
    const pickupDate = new Date(pickupResult.parsedDate);
    const cubeErrors = validateCubeLogic(estimatedResult.parsedCube, actualResult.parsedCube, pickupDate);
    row._validation_errors.push(...cubeErrors);
  } else {
    // If pickup date is invalid, we still need to check if cube values are provided appropriately
    const hasEstimated = estimatedResult.parsedCube !== null && estimatedResult.parsedCube > 0;
    const hasActual = actualResult.parsedCube !== null && actualResult.parsedCube > 0;
    
    if (!hasEstimated && !hasActual) {
      row._validation_errors.push('Either estimated cube or actual cube is required');
    } else if (hasEstimated && hasActual) {
      row._validation_errors.push('Cannot have both estimated and actual cube - choose one based on pickup date');
    }
  }

  console.log(`Row validation errors for ${row.gbl_number}:`, row._validation_errors);
  return row;
};
