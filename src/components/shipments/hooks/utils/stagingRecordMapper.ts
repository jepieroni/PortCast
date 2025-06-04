
import type { ParsedRow } from './csvParser';

export const mapToStagingRecord = (row: ParsedRow, uploadSessionId: string, organizationId: string, userId: string) => {
  // For shipment_type, use a default value if it's invalid to avoid constraint violation
  // The validation_status will be 'invalid' anyway if there are validation errors
  let shipmentType = row.shipment_type;
  if (!shipmentType || (typeof shipmentType === 'string' && ['inbound', 'outbound', 'intertheater'].indexOf(shipmentType) === -1)) {
    // Use 'inbound' as a safe default to avoid constraint violation
    // The record will still be marked as invalid due to validation errors
    shipmentType = 'inbound';
  }

  // Handle null dates by providing a default date to avoid NOT NULL constraint violations
  // Use a recognizable default date (1900-01-01) that can be identified as invalid
  const defaultDate = '1900-01-01';
  const pickupDate = row.parsed_pickup_date || defaultDate;
  const rddDate = row.parsed_rdd || defaultDate;

  return {
    upload_session_id: uploadSessionId,
    organization_id: organizationId,
    user_id: userId,
    gbl_number: row.gbl_number || '',
    shipper_last_name: row.shipper_last_name || '',
    shipment_type: shipmentType,
    origin_rate_area: '',  // Will be populated during validation
    destination_rate_area: '', // Will be populated during validation
    pickup_date: pickupDate,
    rdd: rddDate,
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
