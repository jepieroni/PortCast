
import { supabase } from '@/integrations/supabase/client';
import { validateRecordComplete } from './simpleValidator';
import { BulkUploadRecord } from './bulkUploadTypes';

/**
 * Service for updating individual records with validation
 */
export const updateRecord = async (
  records: BulkUploadRecord[], 
  recordId: string, 
  updates: Partial<BulkUploadRecord>
): Promise<BulkUploadRecord[]> => {
  console.log(`Updating record ${recordId} with:`, updates);

  // Update records in memory and ensure we NEVER touch raw fields in staging table
  const updatedRecords = await Promise.all(
    records.map(async (record) => {
      if (record.id === recordId) {
        // Create updated record with new values - CLEAR OLD WARNINGS FIRST
        const updatedRecord = { 
          ...record, 
          ...updates,
          // CRITICAL: Clear existing warnings and errors to prevent stale data
          warnings: [],
          errors: []
        };
        
        console.log(`Updated record ${recordId}:`, {
          original_shipment_type: record.shipment_type,
          updated_shipment_type: updatedRecord.shipment_type,
          original_pickup_date: record.pickup_date,
          updated_pickup_date: updatedRecord.pickup_date,
          cleared_warnings: 'YES',
          cleared_errors: 'YES'
        });
        
        // Clear existing resolved IDs to force re-validation
        updatedRecord.target_poe_id = undefined;
        updatedRecord.target_pod_id = undefined;
        updatedRecord.tsp_id = undefined;
        
        // Use complete validation that returns both errors AND warnings
        const validationResult = await validateRecordComplete(updatedRecord);
        console.log(`Complete validation result for record ${recordId}:`, validationResult);

        // Determine status based on BOTH errors and warnings
        let newStatus: string;
        if (validationResult.errors.length > 0) {
          newStatus = 'invalid';
        } else if (validationResult.warnings && validationResult.warnings.length > 0) {
          newStatus = 'warning';
        } else {
          newStatus = 'valid';
        }

        console.log(`Setting status to ${newStatus} for record ${recordId} based on:`, {
          errorsCount: validationResult.errors.length,
          warningsCount: validationResult.warnings?.length || 0,
          freshValidationWarnings: validationResult.warnings
        });

        // Update staging table with ONLY the regular fields (never raw fields)
        await supabase
          .from('shipment_uploads_staging')
          .update({
            // Update REGULAR fields for working/corrected values
            gbl_number: updatedRecord.gbl_number,
            shipper_last_name: updatedRecord.shipper_last_name,
            shipment_type: updatedRecord.shipment_type,
            origin_rate_area: updatedRecord.origin_rate_area,
            destination_rate_area: updatedRecord.destination_rate_area,
            pickup_date: updatedRecord.pickup_date,
            rdd: updatedRecord.rdd,
            estimated_cube: updatedRecord.estimated_cube,
            actual_cube: updatedRecord.actual_cube,
            
            // Update validation results - use the correct status based on errors AND warnings
            validation_status: newStatus,
            validation_errors: validationResult.errors,
            validation_warnings: validationResult.warnings || [],
            target_poe_id: updatedRecord.target_poe_id,
            target_pod_id: updatedRecord.target_pod_id,
            tsp_id: updatedRecord.tsp_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId);
        
        return {
          ...updatedRecord,
          status: newStatus as any,
          errors: validationResult.errors,
          warnings: validationResult.warnings || [],
          // CRITICAL: Set the authoritative database status
          validation_status: newStatus
        } as BulkUploadRecord;
      }
      return record;
    })
  );

  return updatedRecords;
};
