
import { supabase } from '@/integrations/supabase/client';
import { BulkUploadRecord } from './bulkUploadTypes';

export const updateStagingRecord = async (recordId: string, updates: Partial<BulkUploadRecord>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Prepare update object for staging table
  // NEVER update raw fields - they preserve the original upload data forever
  const stagingUpdates: any = {
    updated_at: new Date().toISOString()
  };

  // Only update REGULAR fields (these are the working/corrected values)
  if (updates.gbl_number !== undefined) stagingUpdates.gbl_number = updates.gbl_number;
  if (updates.shipper_last_name !== undefined) stagingUpdates.shipper_last_name = updates.shipper_last_name;
  if (updates.shipment_type !== undefined) stagingUpdates.shipment_type = updates.shipment_type;
  if (updates.origin_rate_area !== undefined) stagingUpdates.origin_rate_area = updates.origin_rate_area;
  if (updates.destination_rate_area !== undefined) stagingUpdates.destination_rate_area = updates.destination_rate_area;
  if (updates.pickup_date !== undefined) stagingUpdates.pickup_date = updates.pickup_date;
  if (updates.rdd !== undefined) stagingUpdates.rdd = updates.rdd;
  if (updates.estimated_cube !== undefined) stagingUpdates.estimated_cube = updates.estimated_cube;
  if (updates.actual_cube !== undefined) stagingUpdates.actual_cube = updates.actual_cube;

  // Store resolved IDs
  if (updates.target_poe_id !== undefined) stagingUpdates.target_poe_id = updates.target_poe_id;
  if (updates.target_pod_id !== undefined) stagingUpdates.target_pod_id = updates.target_pod_id;
  if (updates.tsp_id !== undefined) stagingUpdates.tsp_id = updates.tsp_id;

  // Update validation status and errors - these are now dynamic
  if (updates.status !== undefined) stagingUpdates.validation_status = updates.status;
  if (updates.errors !== undefined) stagingUpdates.validation_errors = updates.errors;
  
  // CRITICAL: Warnings are now dynamic like errors, not preserved static data
  if (updates.warnings !== undefined) stagingUpdates.validation_warnings = updates.warnings;

  console.log(`Updating staging record ${recordId} with:`, stagingUpdates);

  const { error } = await supabase
    .from('shipment_uploads_staging')
    .update(stagingUpdates)
    .eq('id', recordId);

  if (error) throw error;

  console.log(`Successfully updated staging record ${recordId}`);
};
