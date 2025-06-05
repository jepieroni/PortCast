import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateRecordComplete } from './utils/simpleValidator';
import { BulkUploadRecord } from './utils/bulkUploadTypes';

type ShipmentType = 'inbound' | 'outbound' | 'intertheater';

export const useRecordProcessing = () => {
  const { toast } = useToast();

  const updateRecord = async (
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

  const processValidRecords = async (records: BulkUploadRecord[]) => {
    const validRecords = records.filter(r => r.status === 'valid');
    if (validRecords.length === 0) {
      toast({
        title: "No valid records",
        description: "Please fix validation errors before processing",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Process records one by one
      for (const record of validRecords) {
        // Normalize shipment type
        let shipmentType: ShipmentType = 'inbound';
        const typeStr = record.shipment_type.toLowerCase().trim();
        if (typeStr === 'i' || typeStr === 'inbound') shipmentType = 'inbound';
        else if (typeStr === 'o' || typeStr === 'outbound') shipmentType = 'outbound';
        else if (typeStr === 't' || typeStr === 'intertheater') shipmentType = 'intertheater';

        // Convert date formats
        const pickupDate = convertDateFormat(record.pickup_date);
        const rddDate = convertDateFormat(record.rdd);

        // Use the resolved IDs from validation, or throw error if missing
        if (!record.target_poe_id || !record.target_pod_id || !record.tsp_id) {
          throw new Error(`Missing resolved IDs for record ${record.gbl_number}. Please re-validate the record.`);
        }

        // Convert cube values to integers for the shipments table
        const estimatedCube = record.estimated_cube ? parseInt(record.estimated_cube) : null;
        const actualCube = record.actual_cube ? parseInt(record.actual_cube) : null;

        const shipmentData = {
          user_id: user.id,
          gbl_number: record.gbl_number,
          shipper_last_name: record.shipper_last_name,
          shipment_type: shipmentType,
          origin_rate_area: record.origin_rate_area,
          destination_rate_area: record.destination_rate_area,
          pickup_date: pickupDate,
          rdd: rddDate,
          estimated_cube: estimatedCube,
          actual_cube: actualCube,
          remaining_cube: actualCube,
          target_poe_id: record.target_poe_id,
          target_pod_id: record.target_pod_id,
          tsp_id: record.tsp_id
        };

        console.log('Inserting shipment data:', shipmentData);

        const { error } = await supabase
          .from('shipments')
          .insert(shipmentData);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: `${validRecords.length} shipments processed successfully`
      });

      return validRecords;

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process shipments",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    updateRecord,
    processValidRecords
  };
};

const convertDateFormat = (dateString: string): string => {
  // If already in ISO format, return as is
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateString)) {
    return dateString;
  }

  // Convert MM/DD/YY or MM/DD/YYYY to YYYY-MM-DD
  const usPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
  const match = dateString.match(usPattern);
  if (match) {
    const [, month, day, year] = match;
    let fullYear = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (fullYear < 100) {
      fullYear = fullYear < 50 ? 2000 + fullYear : 1900 + fullYear;
    }
    
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return dateString; // Fallback
};
