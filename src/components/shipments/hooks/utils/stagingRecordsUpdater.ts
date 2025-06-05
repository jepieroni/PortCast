
import { supabase } from '@/integrations/supabase/client';
import { BulkUploadRecord } from './bulkUploadTypes';
import { validateRecordComplete } from './simpleValidator';

export const updateStagingRecord = async (recordId: string, updates: Partial<BulkUploadRecord>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Prepare update object for staging table - properly typed for database
  // NEVER update raw fields - they preserve the original upload data forever
  const stagingUpdates: Record<string, any> = {
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

  // IMPORTANT: If we're updating any validation-related fields, we need to re-run complete validation
  const validationRelatedFields = ['gbl_number', 'shipper_last_name', 'shipment_type', 'origin_rate_area', 
                                   'destination_rate_area', 'pickup_date', 'rdd', 'estimated_cube', 'actual_cube'];
  
  const hasValidationRelatedUpdates = validationRelatedFields.some(field => updates[field] !== undefined);
  
  if (hasValidationRelatedUpdates) {
    console.log(`Re-validating record ${recordId} due to field updates`);
    
    // Get the current record to re-validate
    const { data: currentRecord } = await supabase
      .from('shipment_uploads_staging')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (currentRecord) {
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

      // Create a record with the updates applied for validation
      const recordToValidate: BulkUploadRecord = {
        id: currentRecord.id,
        gbl_number: updates.gbl_number !== undefined ? updates.gbl_number : currentRecord.gbl_number,
        shipper_last_name: updates.shipper_last_name !== undefined ? updates.shipper_last_name : currentRecord.shipper_last_name,
        shipment_type: updates.shipment_type !== undefined ? updates.shipment_type : currentRecord.shipment_type,
        origin_rate_area: updates.origin_rate_area !== undefined ? updates.origin_rate_area : currentRecord.origin_rate_area,
        destination_rate_area: updates.destination_rate_area !== undefined ? updates.destination_rate_area : currentRecord.destination_rate_area,
        pickup_date: updates.pickup_date !== undefined ? updates.pickup_date : currentRecord.pickup_date,
        rdd: updates.rdd !== undefined ? updates.rdd : currentRecord.rdd,
        poe_code: currentRecord.raw_poe_code || '',
        pod_code: currentRecord.raw_pod_code || '',
        scac_code: currentRecord.raw_scac_code || '',
        estimated_cube: updates.estimated_cube !== undefined ? updates.estimated_cube : currentRecord.estimated_cube,
        actual_cube: updates.actual_cube !== undefined ? updates.actual_cube : currentRecord.actual_cube,
        status: 'pending' as const,
        errors: [],
        warnings: [],
        target_poe_id: updates.target_poe_id,
        target_pod_id: updates.target_pod_id,
        tsp_id: updates.tsp_id,
        validation_status: currentRecord.validation_status,
        validation_errors: jsonToStringArray(currentRecord.validation_errors),
        validation_warnings: jsonToStringArray(currentRecord.validation_warnings)
      };
      
      // Run complete validation including warnings
      const validationResult = await validateRecordComplete(recordToValidate);
      
      // Determine new status based on validation results
      let newStatus: string;
      if (validationResult.errors.length > 0) {
        newStatus = 'invalid';
      } else if (validationResult.warnings && validationResult.warnings.length > 0) {
        newStatus = 'warning';
      } else {
        newStatus = 'valid';
      }
      
      // Store validation results - convert to JSON for database storage
      stagingUpdates.validation_status = newStatus;
      stagingUpdates.validation_errors = validationResult.errors;
      stagingUpdates.validation_warnings = validationResult.warnings || [];
      
      console.log(`Updated validation for record ${recordId}:`, {
        status: newStatus,
        errors: validationResult.errors.length,
        warnings: (validationResult.warnings || []).length
      });
    }
  } else {
    // Update validation status and errors - these are now dynamic
    if (updates.status !== undefined) stagingUpdates.validation_status = updates.status;
    
    // Store arrays directly for database
    if (updates.errors !== undefined) {
      stagingUpdates.validation_errors = Array.isArray(updates.errors) ? updates.errors : [];
    }
    if (updates.warnings !== undefined) {
      stagingUpdates.validation_warnings = Array.isArray(updates.warnings) ? updates.warnings : [];
    }
  }

  console.log(`Updating staging record ${recordId} with:`, stagingUpdates);

  const { error } = await supabase
    .from('shipment_uploads_staging')
    .update(stagingUpdates)
    .eq('id', recordId);

  if (error) throw error;

  console.log(`Successfully updated staging record ${recordId}`);
};
