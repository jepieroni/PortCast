
import { supabase } from '@/integrations/supabase/client';

export const createStagingRecords = async (records: any[], organizationId: string, userId: string) => {
  // Generate a session ID for this upload batch
  const uploadSessionId = crypto.randomUUID();

  // Save all records to staging table immediately with raw data
  const stagingRecords = records.map((record, index) => {
    // Generate a proper UUID for each record instead of using "row-X"
    const recordUuid = crypto.randomUUID();
    
    console.log(`Preparing record ${index + 1} for staging:`, {
      id: recordUuid,
      gbl_number: record.gbl_number,
      shipment_type: record.shipment_type,
      pickup_date: record.pickup_date
    });

    return {
      id: recordUuid, // Use proper UUID instead of "row-X"
      upload_session_id: uploadSessionId,
      organization_id: organizationId,
      user_id: userId,
      
      // Store raw uploaded values - these are the source of truth
      raw_gbl_number: record.gbl_number || '',
      raw_shipper_last_name: record.shipper_last_name || '',
      raw_shipment_type: record.shipment_type || '',
      raw_origin_rate_area: record.origin_rate_area || '',
      raw_destination_rate_area: record.destination_rate_area || '',
      raw_pickup_date: record.pickup_date || '',
      raw_rdd: record.rdd || '',
      raw_poe_code: record.poe_code || '',
      raw_pod_code: record.pod_code || '',
      raw_scac_code: record.scac_code || '',
      raw_estimated_cube: record.estimated_cube || '',
      raw_actual_cube: record.actual_cube || '',
      
      // Store processed values for backward compatibility
      gbl_number: record.gbl_number || '',
      shipper_last_name: record.shipper_last_name || '',
      shipment_type: record.shipment_type || '', // Now text field - accepts any value
      origin_rate_area: record.origin_rate_area || '',
      destination_rate_area: record.destination_rate_area || '',
      pickup_date: record.pickup_date || '',
      rdd: record.rdd || '',
      estimated_cube: record.estimated_cube || '', // Now text field
      actual_cube: record.actual_cube || '', // Now text field
      
      validation_status: 'pending'
    };
  });

  console.log('Inserting records to staging table:', stagingRecords.length);

  const { error: insertError } = await supabase
    .from('shipment_uploads_staging')
    .insert(stagingRecords);

  if (insertError) {
    console.error('Error inserting to staging:', insertError);
    throw insertError;
  }

  console.log('Records successfully saved to staging table');
  return uploadSessionId;
};
