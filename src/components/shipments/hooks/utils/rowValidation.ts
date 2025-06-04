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

  // Validate and map shipment type - Keep original value if invalid to avoid null constraint violation
  const shipmentTypeResult = mapShipmentType(row.shipment_type || '');
  if (!shipmentTypeResult.isValid) {
    row._validation_errors.push('Invalid or missing shipment type. Use I/O/T or inbound/outbound/intertheater');
    // Keep the original invalid value to avoid database constraint violation
    // The staging record will be marked as invalid anyway due to validation errors
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

  // Validate dates - with proper error handling
  const pickupResult = parseAndValidateDate(row.pickup_date || '', 'Pickup date');
  const rddResult = parseAndValidateDate(row.rdd || '', 'Required delivery date');

  if (pickupResult.error) {
    row._validation_errors.push(pickupResult.error);
  }
  if (rddResult.error) {
    row._validation_errors.push(rddResult.error);
  }

  // Store parsed dates (or null if invalid/missing)
  row.parsed_pickup_date = pickupResult.parsedDate;
  row.parsed_rdd = rddResult.parsedDate;

  // Validate cube fields
  const estimatedResult = parseAndValidateCube(row.estimated_cube || '', 'estimated cube');
  const actualResult = parseAndValidateCube(row.actual_cube || '', 'actual cube');

  if (estimatedResult.error) {
    row._validation_errors.push(estimatedResult.error);
  }
  if (actualResult.error) {
    row._validation_errors.push(actualResult.error);
  }

  // Store parsed cube values
  row.parsed_estimated_cube = estimatedResult.parsedCube;
  row.parsed_actual_cube = actualResult.parsedCube;

  // Validate cube logic only if we have a valid pickup date
  if (pickupResult.parsedDate) {
    const pickupDate = new Date(pickupResult.parsedDate);
    const cubeErrors = validateCubeLogic(estimatedResult.parsedCube, actualResult.parsedCube, pickupDate);
    row._validation_errors.push(...cubeErrors);
  }

  console.log(`Row validation errors:`, row._validation_errors);
  return row;
};
