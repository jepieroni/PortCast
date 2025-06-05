
import { BulkUploadRecord } from './bulkUploadTypes';

export const convertStagingRecordToBulkRecord = (record: any): BulkUploadRecord => {
  console.log(`Converting staging record ${record.id}:`, {
    gbl_number: record.gbl_number,
    validation_status: record.validation_status,
    validation_warnings: record.validation_warnings,
    raw_validation_warnings: JSON.stringify(record.validation_warnings)
  });

  // Convert validation_errors from Json to string[]
  let errors: string[] = [];
  if (record.validation_errors) {
    if (typeof record.validation_errors === 'string') {
      try {
        const parsed = JSON.parse(record.validation_errors);
        errors = Array.isArray(parsed) ? parsed : [];
      } catch {
        errors = [record.validation_errors];
      }
    } else if (Array.isArray(record.validation_errors)) {
      errors = record.validation_errors.map(error => 
        typeof error === 'string' ? error : JSON.stringify(error)
      );
    }
  }

  // Convert validation_warnings from Json to string[] - FIXED THIS PART
  let warnings: string[] = [];
  if (record.validation_warnings) {
    console.log('Raw validation_warnings:', record.validation_warnings, 'Type:', typeof record.validation_warnings);
    
    if (typeof record.validation_warnings === 'string') {
      try {
        const parsed = JSON.parse(record.validation_warnings);
        console.log('Parsed warnings:', parsed);
        warnings = Array.isArray(parsed) ? parsed.filter(w => w && w.toString().trim() !== '') : [];
      } catch {
        warnings = record.validation_warnings.trim() !== '' ? [record.validation_warnings] : [];
      }
    } else if (Array.isArray(record.validation_warnings)) {
      console.log('Array validation_warnings:', record.validation_warnings);
      warnings = record.validation_warnings
        .map(warning => typeof warning === 'string' ? warning : JSON.stringify(warning))
        .filter(w => w && w.toString().trim() !== '');
    } else {
      // Handle JSON object directly (this might be the issue)
      console.log('Direct object validation_warnings:', record.validation_warnings);
      try {
        const stringified = JSON.stringify(record.validation_warnings);
        const parsed = JSON.parse(stringified);
        if (Array.isArray(parsed)) {
          warnings = parsed.filter(w => w && w.toString().trim() !== '');
        }
      } catch (e) {
        console.log('Failed to process validation_warnings as object:', e);
      }
    }
  }

  console.log(`Processed warnings for ${record.gbl_number}:`, warnings);

  // Determine status - CRITICAL: Check warnings BEFORE deciding status
  let status: 'valid' | 'invalid' | 'pending' | 'warning';
  if (record.validation_status === 'pending') {
    status = 'pending';
  } else if (errors.length > 0) {
    status = 'invalid';
  } else if (warnings.length > 0) {
    console.log(`Setting status to WARNING for ${record.gbl_number} because warnings.length = ${warnings.length}`);
    status = 'warning';  // This should trigger for records with warnings
  } else {
    status = 'valid';
  }

  const convertedRecord: BulkUploadRecord = {
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
    
    // Use the properly determined status
    status,
    errors,
    warnings, // This should now have the actual warnings
    
    // Carry over resolved IDs if they exist
    target_poe_id: record.target_poe_id,
    target_pod_id: record.target_pod_id,
    tsp_id: record.tsp_id,
    
    // CRITICAL: Pass through the database fields that SimplifiedReviewTable expects
    validation_status: status, // Use the calculated status, not the raw database status
    validation_errors: record.validation_errors,
    validation_warnings: record.validation_warnings
  };

  console.log(`Final converted record for ${record.gbl_number}:`, {
    status: convertedRecord.status,
    warnings: convertedRecord.warnings,
    validation_warnings: convertedRecord.validation_warnings,
    finalStatus: convertedRecord.validation_status,
    warningsLength: convertedRecord.warnings.length
  });

  return convertedRecord;
};
