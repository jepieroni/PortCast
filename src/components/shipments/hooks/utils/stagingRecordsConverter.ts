import { BulkUploadRecord } from './bulkUploadTypes';

export const convertStagingRecordToBulkRecord = (stagingRecord: any): BulkUploadRecord => {
  // Helper function to safely convert Json to string array
  const jsonToStringArray = (jsonValue: any): string[] => {
    if (!jsonValue) return [];
    if (Array.isArray(jsonValue)) {
      return jsonValue.map(item => typeof item === 'string' ? item : JSON.stringify(item));
    }
    if (typeof jsonValue === 'string') {
      try {
        const parsed = JSON.parse(jsonValue);
        return Array.isArray(parsed) ? parsed : [jsonValue];
      } catch {
        return [jsonValue];
      }
    }
    return [];
  };

  // Convert staging record to BulkUploadRecord format
  const converted: BulkUploadRecord = {
    id: stagingRecord.id,
    gbl_number: stagingRecord.gbl_number || '',
    shipper_last_name: stagingRecord.shipper_last_name || '',
    shipment_type: stagingRecord.shipment_type || '',
    origin_rate_area: stagingRecord.origin_rate_area || '',
    destination_rate_area: stagingRecord.destination_rate_area || '',
    pickup_date: stagingRecord.pickup_date || '',
    rdd: stagingRecord.rdd || '',
    poe_code: stagingRecord.raw_poe_code || '',
    pod_code: stagingRecord.raw_pod_code || '',
    scac_code: stagingRecord.raw_scac_code || '',
    estimated_cube: stagingRecord.estimated_cube || '',
    actual_cube: stagingRecord.actual_cube || '',
    status: stagingRecord.validation_status || 'pending',
    errors: jsonToStringArray(stagingRecord.validation_errors),
    warnings: jsonToStringArray(stagingRecord.validation_warnings),
    approved_warnings: jsonToStringArray(stagingRecord.approved_warnings), // Add approved warnings
    target_poe_id: stagingRecord.target_poe_id,
    target_pod_id: stagingRecord.target_pod_id,
    tsp_id: stagingRecord.tsp_id,
    validation_status: stagingRecord.validation_status,
    validation_errors: jsonToStringArray(stagingRecord.validation_errors),
    validation_warnings: jsonToStringArray(stagingRecord.validation_warnings)
  };

  console.log(`🔄 CONVERTER: Converted staging record ${stagingRecord.id}:`, {
    gbl_number: converted.gbl_number,
    status: converted.status,
    warnings: converted.warnings,
    approved_warnings: converted.approved_warnings,
    validation_status: converted.validation_status
  });

  return converted;
};
