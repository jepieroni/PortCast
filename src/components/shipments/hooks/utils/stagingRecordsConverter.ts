
import { BulkUploadRecord } from './bulkUploadTypes';

export const convertStagingRecordToBulkRecord = (record: any): BulkUploadRecord => {
  console.log(`Converting staging record ${record.id}:`, {
    gbl_number: record.gbl_number,
    validation_status: record.validation_status,
    validation_warnings: record.validation_warnings
  });

  // Convert validation_errors from Json[] to string[]
  let errors: string[] = [];
  if (Array.isArray(record.validation_errors)) {
    errors = record.validation_errors.map(error => 
      typeof error === 'string' ? error : JSON.stringify(error)
    );
  }

  // Convert validation_warnings from Json[] to string[] - these are now dynamic like errors
  let warnings: string[] = [];
  if (Array.isArray(record.validation_warnings)) {
    warnings = record.validation_warnings.map(warning => 
      typeof warning === 'string' ? warning : JSON.stringify(warning)
    );
  }

  console.log(`Converted warnings for ${record.gbl_number}:`, warnings);

  return {
    id: record.id,
    // Use REGULAR fields for validation and editing (these are the corrected values)
    gbl_number: record.gbl_number || '',
    shipper_last_name: record.shipper_last_name || '',
    shipment_type: record.shipment_type || '',
    origin_rate_area: record.origin_rate_area || '',
    destination_rate_area: record.destination_rate_area || '',
    pickup_date: record.pickup_date || '', // Use regular field, NOT raw
    rdd: record.rdd || '',
    poe_code: record.raw_poe_code || '', // These don't have regular equivalents yet
    pod_code: record.raw_pod_code || '',
    scac_code: record.raw_scac_code || '',
    estimated_cube: record.estimated_cube || '',
    actual_cube: record.actual_cube || '',
    
    // Determine status: if no errors and no pending status, it's valid
    status: errors.length === 0 && record.validation_status !== 'pending' ? 'valid' : 
            record.validation_status === 'pending' ? 'pending' : 'invalid',
    errors,
    warnings, // Now dynamic validation results, not preserved static data
    
    // Carry over resolved IDs if they exist
    target_poe_id: record.target_poe_id,
    target_pod_id: record.target_pod_id,
    tsp_id: record.tsp_id
  };
};
