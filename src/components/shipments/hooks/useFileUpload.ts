
import { supabase } from '@/integrations/supabase/client';
import { parseCSV } from './utils/simpleCsvParser';
import { validateRecordSync } from './utils/simpleValidator';
import { BulkUploadRecord } from './utils/bulkUploadTypes';

export const useFileUpload = () => {
  const uploadFile = async (file: File) => {
    try {
      // Get user and organization info first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Parse the CSV file
      const text = await file.text();
      console.log('Raw CSV text preview:', text.substring(0, 500));
      
      const records = parseCSV(text);
      console.log('Parsed records:', records.length);
      console.log('First record sample:', records[0]);

      // Generate a session ID for this upload batch
      const uploadSessionId = crypto.randomUUID();

      // Save all records to staging table immediately with raw data
      const stagingRecords = records.map((record, index) => {
        console.log(`Preparing record ${index + 1} for staging:`, {
          id: record.id,
          gbl_number: record.gbl_number,
          shipment_type: record.shipment_type,
          pickup_date: record.pickup_date
        });

        return {
          id: record.id,
          upload_session_id: uploadSessionId,
          organization_id: profile.organization_id,
          user_id: user.id,
          
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
          
          // Store processed values for backward compatibility (set enum fields to null for raw data)
          gbl_number: record.gbl_number || '',
          shipper_last_name: record.shipper_last_name || '',
          shipment_type: null, // Set to null since raw value might not match enum
          origin_rate_area: record.origin_rate_area || '',
          destination_rate_area: record.destination_rate_area || '',
          pickup_date: record.pickup_date || '',
          rdd: record.rdd || '',
          estimated_cube: record.estimated_cube ? parseInt(record.estimated_cube) : null,
          actual_cube: record.actual_cube ? parseInt(record.actual_cube) : null,
          
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

      // Now load and validate the records from staging
      const { data: stagingData, error: loadError } = await supabase
        .from('shipment_uploads_staging')
        .select('*')
        .eq('upload_session_id', uploadSessionId)
        .order('created_at', { ascending: true });

      if (loadError) throw loadError;

      console.log('Loaded records from staging for validation:', stagingData?.length);

      // Convert staging records to BulkUploadRecord format and validate
      const validatedRecords = stagingData?.map((record) => {
        // Use raw values as the source of truth
        const bulkRecord: BulkUploadRecord = {
          id: record.id,
          gbl_number: record.raw_gbl_number || '',
          shipper_last_name: record.raw_shipper_last_name || '',
          shipment_type: record.raw_shipment_type || '',
          origin_rate_area: record.raw_origin_rate_area || '',
          destination_rate_area: record.raw_destination_rate_area || '',
          pickup_date: record.raw_pickup_date || '',
          rdd: record.raw_rdd || '',
          poe_code: record.raw_poe_code || '',
          pod_code: record.raw_pod_code || '',
          scac_code: record.raw_scac_code || '',
          estimated_cube: record.raw_estimated_cube || '',
          actual_cube: record.raw_actual_cube || '',
          status: 'pending',
          errors: []
        };

        // Perform initial synchronous validation
        const errors = validateRecordSync(bulkRecord);
        console.log(`Initial validation errors for record ${record.id}:`, errors);
        
        return {
          ...bulkRecord,
          status: errors.length === 0 ? 'pending' : 'invalid',
          errors
        } as BulkUploadRecord;
      }) || [];

      // Calculate summary
      const summary = {
        total: validatedRecords.length,
        valid: validatedRecords.filter(r => r.status === 'pending').length,
        invalid: validatedRecords.filter(r => r.status === 'invalid').length,
        pending: validatedRecords.filter(r => r.status === 'pending').length
      };

      console.log('Initial validation summary:', summary);

      return {
        records: validatedRecords,
        summary
      };

    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  return {
    uploadFile
  };
};
