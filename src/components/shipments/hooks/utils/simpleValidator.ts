
import { BulkUploadRecord } from './bulkUploadTypes';
import { validateRequiredFields } from './fieldValidators';
import { validateDateFields, parseDate } from './dateValidation';
import { validatePortCode, validateRateAreas, validateScacCode } from './portValidation';
import { validateCubeFields } from './cubeValidation';
import { generateDateWarnings } from './warningCheckers';

export const validateRecord = async (record: BulkUploadRecord, approvedWarnings?: string[]): Promise<string[]> => {
  const errors: string[] = [];
  
  // CRITICAL: Create a deep copy to prevent cross-contamination between records
  const workingRecord = JSON.parse(JSON.stringify(record));

  // Required field validation
  errors.push(...validateRequiredFields(workingRecord));

  // Date validation
  errors.push(...validateDateFields(workingRecord));

  // Parse pickup date for cube validation and warnings
  let pickupDate: Date | null = null;
  if (workingRecord.pickup_date && workingRecord.pickup_date.trim() !== '') {
    const dateStr = workingRecord.pickup_date.trim();
    console.log(`Validating pickup date for ${workingRecord.gbl_number}: "${dateStr}"`);
    pickupDate = parseDate(dateStr);
    console.log(`Parsed pickup date for ${workingRecord.gbl_number}:`, pickupDate);
    
    if (pickupDate) {
      // Initialize warnings array if it doesn't exist
      if (!workingRecord.warnings) workingRecord.warnings = [];
      
      // Generate date warnings
      const dateWarnings = generateDateWarnings(workingRecord, approvedWarnings);
      workingRecord.warnings.push(...dateWarnings);
    }
  }

  // Rate area validation
  errors.push(...await validateRateAreas(workingRecord));

  // Port validation
  if (workingRecord.poe_code && workingRecord.poe_code.trim() !== '') {
    const poeResult = await validatePortCode(workingRecord.poe_code.trim(), 'POE');
    if (poeResult.error) {
      errors.push(poeResult.error);
    } else if (poeResult.portId) {
      workingRecord.target_poe_id = poeResult.portId;
    }
  }
  
  if (workingRecord.pod_code && workingRecord.pod_code.trim() !== '') {
    const podResult = await validatePortCode(workingRecord.pod_code.trim(), 'POD');
    if (podResult.error) {
      errors.push(podResult.error);
    } else if (podResult.portId) {
      workingRecord.target_pod_id = podResult.portId;
    }
  }

  // SCAC code validation
  if (workingRecord.scac_code && workingRecord.scac_code.trim() !== '') {
    const scacResult = await validateScacCode(workingRecord.scac_code);
    if (scacResult.error) {
      errors.push(scacResult.error);
    } else if (scacResult.tspId) {
      workingRecord.tsp_id = scacResult.tspId;
    }
  }

  // Cube validation
  errors.push(...validateCubeFields(workingRecord, pickupDate));

  // CRITICAL: Copy warnings back to the original record to prevent data loss
  if (workingRecord.warnings && workingRecord.warnings.length > 0) {
    record.warnings = [...workingRecord.warnings];
  }
  
  // Copy resolved IDs back to original record
  if (workingRecord.target_poe_id) record.target_poe_id = workingRecord.target_poe_id;
  if (workingRecord.target_pod_id) record.target_pod_id = workingRecord.target_pod_id;
  if (workingRecord.tsp_id) record.tsp_id = workingRecord.tsp_id;

  console.log(`Validation complete for ${workingRecord.gbl_number}:`, {
    errors: errors.length,
    warnings: workingRecord.warnings?.length || 0,
    warningMessages: workingRecord.warnings || [],
    approvedWarnings: approvedWarnings || []
  });

  return errors;
};

// Create a function that returns both errors AND warnings for complete validation with approved warnings support
export const validateRecordComplete = async (record: BulkUploadRecord, approvedWarnings?: string[]): Promise<{ errors: string[], warnings: string[] }> => {
  const errors = await validateRecord(record, approvedWarnings);
  const warnings = record.warnings || [];
  
  console.log(`Complete validation for ${record.gbl_number}:`, {
    errors: errors.length,
    warnings: warnings.length,
    errorMessages: errors,
    warningMessages: warnings,
    approvedWarnings: approvedWarnings || []
  });
  
  return { errors, warnings };
};

// Create a synchronous version for immediate validation without database lookups
export const validateRecordSync = (record: BulkUploadRecord): string[] => {
  const errors: string[] = [];

  // Required field validation - simple null/empty checks
  errors.push(...validateRequiredFields(record));

  // Date validation
  errors.push(...validateDateFields(record));

  // Parse pickup date for cube validation
  let pickupDate: Date | null = null;
  if (record.pickup_date && record.pickup_date.trim() !== '') {
    pickupDate = parseDate(record.pickup_date.trim());
  }

  // Cube validation
  errors.push(...validateCubeFields(record, pickupDate));

  return errors;
};
