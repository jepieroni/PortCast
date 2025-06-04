
import type { ParsedRow } from './csvParser';

export const mapToStagingRecord = (row: ParsedRow, uploadSessionId: string, organizationId: string, userId: string) => {
  // For shipment_type, use null if invalid to force validation failure
  let shipmentType = row.shipment_type;
  if (!shipmentType || (typeof shipmentType === 'string' && ['inbound', 'outbound', 'intertheater'].indexOf(shipmentType) === -1)) {
    shipmentType = null; // This will cause validation to fail
  }

  // Handle dates - use null for invalid dates to force validation failure
  const pickupDate = row.parsed_pickup_date || null;
  const rddDate = row.parsed_rdd || null;

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
    estimated_cube: row.parsed_estimated_cube || null,
    actual_cube: row.parsed_actual_cube || null,
    remaining_cube: null, // We don't care about this during import
    raw_poe_code: row.poe_code || '',
    raw_pod_code: row.pod_code || '',
    raw_origin_rate_area: row.origin_rate_area || '',
    raw_destination_rate_area: row.destination_rate_area || '',
    raw_scac_code: row.scac_code || '',
    // Start with 'pending' status - records will be validated asynchronously
    validation_status: 'pending',
    validation_errors: row._validation_errors || []
  };
};
