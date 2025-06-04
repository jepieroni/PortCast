
import type { ParsedRow } from './csvParser';

export const mapToStagingRecord = (row: ParsedRow, uploadSessionId: string, organizationId: string, userId: string) => {
  return {
    upload_session_id: uploadSessionId,
    organization_id: organizationId,
    user_id: userId,
    gbl_number: row.gbl_number || '',
    shipper_last_name: row.shipper_last_name || '',
    // Only set shipment_type if it's valid, otherwise leave null
    shipment_type: row.shipment_type, // This will be null for invalid types
    origin_rate_area: '',  // Will be populated during validation
    destination_rate_area: '', // Will be populated during validation
    pickup_date: row.parsed_pickup_date, // Use parsed date or null
    rdd: row.parsed_rdd, // Use parsed date or null
    estimated_cube: row.parsed_estimated_cube,
    actual_cube: row.parsed_actual_cube,
    remaining_cube: null, // We don't care about this during import
    raw_poe_code: row.poe_code || '',
    raw_pod_code: row.pod_code || '',
    raw_origin_rate_area: row.origin_rate_area || '',
    raw_destination_rate_area: row.destination_rate_area || '',
    raw_scac_code: row.scac_code || '',
    validation_status: row._validation_errors && row._validation_errors.length > 0 ? 'invalid' : 'pending',
    validation_errors: row._validation_errors || []
  };
};
