
import { supabase } from '@/integrations/supabase/client';
import { BulkUploadRecord } from './bulkUploadTypes';
import { validateRecordComplete } from './simpleValidator';

export const updateStagingRecord = async (recordId: string, updates: Partial<BulkUploadRecord>) => {
  console.log(`🔧 STAGING UPDATER: Starting update for record ${recordId}`, updates);
  
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

  // Handle approved warnings updates
  if (updates.approved_warnings !== undefined) {
    console.log(`🔧 STAGING UPDATER: Processing approved warnings update:`, updates.approved_warnings);
    stagingUpdates.approved_warnings = updates.approved_warnings;
  }

  // IMPORTANT: If we're updating any validation-related fields, we need to re-run complete validation
  const validationRelatedFields = ['gbl_number', 'shipper_last_name', 'shipment_type', 'origin_rate_area', 
                                   'destination_rate_area', 'pickup_date', 'rdd', 'estimated_cube', 'actual_cube'];
  
  const hasValidationRelatedUpdates = validationRelatedFields.some(field => updates[field] !== undefined);
  const hasApprovedWarningsUpdate = updates.approved_warnings !== undefined;
  
  console.log(`🔧 STAGING UPDATER: Update flags - hasValidationRelatedUpdates: ${hasValidationRelatedUpdates}, hasApprovedWarningsUpdate: ${hasApprovedWarningsUpdate}`);
  
  if (hasValidationRelatedUpdates || hasApprovedWarningsUpdate) {
    console.log(`🔧 STAGING UPDATER: Re-validating record ${recordId} due to field updates or approved warnings`);
    
    // Get the current record to re-validate
    const { data: currentRecord } = await supabase
      .from('shipment_uploads_staging')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (currentRecord) {
      console.log(`🔧 STAGING UPDATER: Current record from DB:`, {
        id: currentRecord.id,
        gbl_number: currentRecord.gbl_number,
        pickup_date: currentRecord.pickup_date,
        validation_status: currentRecord.validation_status,
        validation_warnings: currentRecord.validation_warnings,
        approved_warnings: currentRecord.approved_warnings
      });

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

      // Get approved warnings (use updated value if provided, otherwise current)
      const approvedWarnings = updates.approved_warnings !== undefined ? 
        updates.approved_warnings : 
        jsonToStringArray(currentRecord.approved_warnings);

      console.log(`🔧 STAGING UPDATER: Using approved warnings for validation:`, approvedWarnings);

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
        approved_warnings: approvedWarnings,
        target_poe_id: updates.target_poe_id,
        target_pod_id: updates.target_pod_id,
        tsp_id: updates.tsp_id,
        validation_status: currentRecord.validation_status,
        validation_errors: jsonToStringArray(currentRecord.validation_errors),
        validation_warnings: jsonToStringArray(currentRecord.validation_warnings)
      };
      
      console.log(`🔧 STAGING UPDATER: Record to validate (with approved warnings):`, {
        id: recordToValidate.id,
        gbl_number: recordToValidate.gbl_number,
        pickup_date: recordToValidate.pickup_date,
        approvedWarnings: recordToValidate.approved_warnings,
        approvedWarningsType: typeof recordToValidate.approved_warnings,
        approvedWarningsLength: recordToValidate.approved_warnings?.length
      });
      
      // Run complete validation including warnings, passing approved warnings
      console.log(`🔧 STAGING UPDATER: Calling validateRecordComplete with approved warnings:`, approvedWarnings);
      const validationResult = await validateRecordComplete(recordToValidate, approvedWarnings);
      
      console.log(`🔧 STAGING UPDATER: Validation result after passing approved warnings:`, {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        errorsCount: validationResult.errors.length,
        warningsCount: validationResult.warnings?.length || 0,
        approvedWarningsPassedIn: approvedWarnings,
        approvedWarningsLength: approvedWarnings?.length || 0
      });
      
      // Determine new status based on validation results and approved warnings
      let newStatus: string;
      if (validationResult.errors.length > 0) {
        newStatus = 'invalid';
        console.log(`🔧 STAGING UPDATER: Status set to invalid due to ${validationResult.errors.length} errors`);
      } else if (validationResult.warnings && validationResult.warnings.length > 0) {
        newStatus = 'warning';
        console.log(`🔧 STAGING UPDATER: Status set to warning due to ${validationResult.warnings.length} warnings`);
      } else {
        newStatus = 'valid';
        console.log(`🔧 STAGING UPDATER: Status set to valid - no errors or warnings`);
      }
      
      console.log(`🔧 STAGING UPDATER: Final determined status: ${newStatus}`);
      
      // Store validation results - convert to JSON for database storage
      stagingUpdates.validation_status = newStatus;
      stagingUpdates.validation_errors = validationResult.errors;
      stagingUpdates.validation_warnings = validationResult.warnings || [];
      
      console.log(`🔧 STAGING UPDATER: Final staging updates to save:`, {
        validation_status: stagingUpdates.validation_status,
        validation_errors: stagingUpdates.validation_errors,
        validation_warnings: stagingUpdates.validation_warnings,
        approved_warnings: stagingUpdates.approved_warnings
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

  console.log(`🔧 STAGING UPDATER: About to update database with:`, stagingUpdates);

  const { error } = await supabase
    .from('shipment_uploads_staging')
    .update(stagingUpdates)
    .eq('id', recordId);

  if (error) {
    console.error(`🔧 STAGING UPDATER: Database update error:`, error);
    throw error;
  }

  console.log(`🔧 STAGING UPDATER: Successfully updated staging record ${recordId}`);
  
  // Verify the update by fetching the record again
  const { data: verifyRecord } = await supabase
    .from('shipment_uploads_staging')
    .select('*')
    .eq('id', recordId)
    .single();
    
  console.log(`🔧 STAGING UPDATER: Verification - record after update:`, {
    id: verifyRecord?.id,
    gbl_number: verifyRecord?.gbl_number,
    pickup_date: verifyRecord?.pickup_date,
    validation_status: verifyRecord?.validation_status,
    validation_warnings: verifyRecord?.validation_warnings,
    approved_warnings: verifyRecord?.approved_warnings,
    warningsType: typeof verifyRecord?.validation_warnings,
    approvedType: typeof verifyRecord?.approved_warnings
  });
};

// New function specifically for approving warnings
export const approveWarnings = async (recordId: string, approvedWarningTypes: string[]) => {
  console.log(`🔧 STAGING UPDATER: === APPROVE WARNINGS CALLED ===`);
  console.log(`🔧 STAGING UPDATER: Record ID: ${recordId}`);
  console.log(`🔧 STAGING UPDATER: Approved warning types:`, approvedWarningTypes);
  console.log(`🔧 STAGING UPDATER: Types array length:`, approvedWarningTypes.length);
  
  await updateStagingRecord(recordId, {
    approved_warnings: approvedWarningTypes
  });
  
  console.log(`🔧 STAGING UPDATER: === APPROVE WARNINGS COMPLETED ===`);
};
