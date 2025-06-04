
import { BulkUploadRecord } from './bulkUploadTypes';

export const validateRecord = (record: BulkUploadRecord): string[] => {
  const errors: string[] = [];

  // Required field validation
  if (!record.gbl_number?.trim()) errors.push('GBL number is required');
  if (!record.shipper_last_name?.trim()) errors.push('Shipper last name is required');
  if (!record.shipment_type?.trim()) errors.push('Shipment type is required');
  if (!record.origin_rate_area?.trim()) errors.push('Origin rate area is required');
  if (!record.destination_rate_area?.trim()) errors.push('Destination rate area is required');
  if (!record.pickup_date?.trim()) errors.push('Pickup date is required');
  if (!record.rdd?.trim()) errors.push('Required delivery date is required');
  if (!record.poe_code?.trim()) errors.push('POE code is required');
  if (!record.pod_code?.trim()) errors.push('POD code is required');
  if (!record.scac_code?.trim()) errors.push('SCAC code is required');

  // Shipment type validation
  const validTypes = ['inbound', 'outbound', 'intertheater', 'i', 'o', 't'];
  if (record.shipment_type && !validTypes.includes(record.shipment_type.toLowerCase())) {
    errors.push('Invalid shipment type. Must be inbound, outbound, or intertheater');
  }

  // Date validation
  if (record.pickup_date && !isValidDate(record.pickup_date)) {
    errors.push('Invalid pickup date format');
  }
  if (record.rdd && !isValidDate(record.rdd)) {
    errors.push('Invalid required delivery date format');
  }

  // Cube validation
  const hasEstimated = record.estimated_cube && Number(record.estimated_cube) > 0;
  const hasActual = record.actual_cube && Number(record.actual_cube) > 0;
  
  if (!hasEstimated && !hasActual) {
    errors.push('Either estimated cube or actual cube is required');
  }
  if (hasEstimated && hasActual) {
    errors.push('Cannot have both estimated and actual cube');
  }

  return errors;
};

const isValidDate = (dateString: string): boolean => {
  // Check ISO format (YYYY-MM-DD)
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateString)) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  // Check MM/DD/YY format
  const shortPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
  const match = dateString.match(shortPattern);
  if (match) {
    const [, month, day, year] = match;
    const fullYear = 2000 + parseInt(year);
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    return !isNaN(date.getTime());
  }

  return false;
};
