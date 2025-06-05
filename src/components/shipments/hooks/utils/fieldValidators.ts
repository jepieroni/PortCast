
import { BulkUploadRecord } from './bulkUploadTypes';

export const validateRequiredFields = (record: BulkUploadRecord): string[] => {
  const errors: string[] = [];

  if (!record.gbl_number || record.gbl_number.trim() === '') {
    errors.push('GBL number is required');
  }
  
  if (!record.shipper_last_name || record.shipper_last_name.trim() === '') {
    errors.push('Shipper last name is required');
  }
  
  if (!record.shipment_type || record.shipment_type.trim() === '') {
    errors.push('Shipment type is required');
  } else {
    const type = record.shipment_type.trim().toLowerCase();
    if (!['i', 'o', 't', 'inbound', 'outbound', 'intertheater'].includes(type)) {
      errors.push('Shipment type must be I, O, T, Inbound, Outbound, or Intertheater');
    }
  }
  
  if (!record.origin_rate_area || record.origin_rate_area.trim() === '') {
    errors.push('Origin rate area is required');
  }
  
  if (!record.destination_rate_area || record.destination_rate_area.trim() === '') {
    errors.push('Destination rate area is required');
  }
  
  if (!record.poe_code || record.poe_code.trim() === '') {
    errors.push('POE code is required');
  }
  
  if (!record.pod_code || record.pod_code.trim() === '') {
    errors.push('POD code is required');
  }
  
  if (!record.scac_code || record.scac_code.trim() === '') {
    errors.push('SCAC code is required');
  }

  return errors;
};
