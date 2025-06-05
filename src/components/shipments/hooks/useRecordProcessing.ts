import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateRecord } from './utils/simpleValidator';
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

    // Update the staging table directly
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Prepare staging update - only update raw fields when explicitly changing user input
    const stagingUpdates: any = {
      updated_at: new Date().toISOString()
    };

    // Only update raw fields if this is an explicit user edit (not a revalidation)
    if (!updates._revalidate) {
      // Map updates to raw fields - these are the user's actual input values
      if (updates.gbl_number !== undefined) {
        stagingUpdates.raw_gbl_number = updates.gbl_number;
      }
      if (updates.shipper_last_name !== undefined) {
        stagingUpdates.raw_shipper_last_name = updates.shipper_last_name;
      }
      if (updates.shipment_type !== undefined) {
        stagingUpdates.raw_shipment_type = updates.shipment_type;
      }
      if (updates.origin_rate_area !== undefined) {
        stagingUpdates.raw_origin_rate_area = updates.origin_rate_area;
      }
      if (updates.destination_rate_area !== undefined) {
        stagingUpdates.raw_destination_rate_area = updates.destination_rate_area;
      }
      if (updates.pickup_date !== undefined) {
        stagingUpdates.raw_pickup_date = updates.pickup_date;
      }
      if (updates.rdd !== undefined) {
        stagingUpdates.raw_rdd = updates.rdd;
      }
      if (updates.poe_code !== undefined) {
        stagingUpdates.raw_poe_code = updates.poe_code;
      }
      if (updates.pod_code !== undefined) {
        stagingUpdates.raw_pod_code = updates.pod_code;
      }
      if (updates.scac_code !== undefined) {
        stagingUpdates.raw_scac_code = updates.scac_code;
      }
      if (updates.estimated_cube !== undefined) {
        stagingUpdates.raw_estimated_cube = updates.estimated_cube;
      }
      if (updates.actual_cube !== undefined) {
        stagingUpdates.raw_actual_cube = updates.actual_cube;
      }
    }

    // Always update processed fields for display/validation purposes
    if (updates.gbl_number !== undefined) {
      stagingUpdates.gbl_number = updates.gbl_number;
    }
    if (updates.shipper_last_name !== undefined) {
      stagingUpdates.shipper_last_name = updates.shipper_last_name;
    }
    if (updates.shipment_type !== undefined) {
      stagingUpdates.shipment_type = updates.shipment_type;
    }
    if (updates.origin_rate_area !== undefined) {
      stagingUpdates.origin_rate_area = updates.origin_rate_area;
    }
    if (updates.destination_rate_area !== undefined) {
      stagingUpdates.destination_rate_area = updates.destination_rate_area;
    }
    if (updates.pickup_date !== undefined) {
      stagingUpdates.pickup_date = updates.pickup_date;
    }
    if (updates.rdd !== undefined) {
      stagingUpdates.rdd = updates.rdd;
    }
    if (updates.estimated_cube !== undefined) {
      stagingUpdates.estimated_cube = updates.estimated_cube;
    }
    if (updates.actual_cube !== undefined) {
      stagingUpdates.actual_cube = updates.actual_cube;
    }

    // If this is a revalidation trigger, clear resolved IDs to force re-validation
    if (updates._revalidate) {
      stagingUpdates.target_poe_id = null;
      stagingUpdates.target_pod_id = null;
      stagingUpdates.tsp_id = null;
      stagingUpdates.validation_status = 'pending';
    }

    // Update staging record
    const { error: updateError } = await supabase
      .from('shipment_uploads_staging')
      .update(stagingUpdates)
      .eq('id', recordId);

    if (updateError) throw updateError;

    // Now reload and revalidate all records
    const updatedRecords = await Promise.all(
      records.map(async (record) => {
        if (record.id === recordId) {
          // Create updated record with new values
          const updatedRecord = { ...record, ...updates };
          console.log(`Updated record ${recordId}:`, {
            original_shipment_type: record.shipment_type,
            updated_shipment_type: updatedRecord.shipment_type,
            original_pickup_date: record.pickup_date,
            updated_pickup_date: updatedRecord.pickup_date
          });
          
          // Clear existing resolved IDs to force re-validation
          updatedRecord.target_poe_id = undefined;
          updatedRecord.target_pod_id = undefined;
          updatedRecord.tsp_id = undefined;
          
          const errors = await validateRecord(updatedRecord);
          console.log(`Re-validation errors for record ${recordId}:`, errors);

          // Update staging with validation results
          await supabase
            .from('shipment_uploads_staging')
            .update({
              validation_status: errors.length === 0 ? 'valid' : 'invalid',
              validation_errors: errors,
              target_poe_id: updatedRecord.target_poe_id,
              target_pod_id: updatedRecord.target_pod_id,
              tsp_id: updatedRecord.tsp_id
            })
            .eq('id', recordId);
          
          return {
            ...updatedRecord,
            status: errors.length === 0 ? 'valid' : 'invalid',
            errors
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
