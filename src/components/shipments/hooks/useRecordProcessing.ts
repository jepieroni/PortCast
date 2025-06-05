
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

    // If this is a revalidation trigger, skip the update and just revalidate
    if (updates._revalidate) {
      const updatedRecords = await Promise.all(
        records.map(async (record) => {
          if (record.id === recordId) {
            console.log(`Re-validating record ${recordId} after translation creation`);
            
            // Clear existing resolved IDs to force re-validation
            const recordToValidate = {
              ...record,
              target_poe_id: undefined,
              target_pod_id: undefined,
              tsp_id: undefined
            };
            
            const errors = await validateRecord(recordToValidate);
            console.log(`Re-validation errors for record ${recordId}:`, errors);
            
            return {
              ...record,
              status: errors.length === 0 ? 'valid' : 'invalid',
              errors,
              target_poe_id: recordToValidate.target_poe_id,
              target_pod_id: recordToValidate.target_pod_id,
              tsp_id: recordToValidate.tsp_id
            } as BulkUploadRecord;
          }
          return record;
        })
      );

      return updatedRecords;
    }

    const updatedRecords = await Promise.all(
      records.map(async (record) => {
        if (record.id === recordId) {
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

        const shipmentData = {
          user_id: user.id,
          gbl_number: record.gbl_number,
          shipper_last_name: record.shipper_last_name,
          shipment_type: shipmentType,
          origin_rate_area: record.origin_rate_area,
          destination_rate_area: record.destination_rate_area,
          pickup_date: pickupDate,
          rdd: rddDate,
          estimated_cube: record.estimated_cube ? parseInt(record.estimated_cube) : null,
          actual_cube: record.actual_cube ? parseInt(record.actual_cube) : null,
          remaining_cube: record.actual_cube ? parseInt(record.actual_cube) : null,
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
