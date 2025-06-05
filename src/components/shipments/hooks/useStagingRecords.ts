
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateRecord } from './utils/simpleValidator';
import { BulkUploadRecord } from './utils/bulkUploadTypes';

export const useStagingRecords = () => {
  const { toast } = useToast();
  const [hasStagingRecords, setHasStagingRecords] = useState(false);
  const [isCheckingStagingRecords, setIsCheckingStagingRecords] = useState(false);

  const checkForStagingRecords = async () => {
    setIsCheckingStagingRecords(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) return false;

      const { data: stagingRecords, error } = await supabase
        .from('shipment_uploads_staging')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .limit(1);

      if (error) throw error;

      const hasRecords = stagingRecords && stagingRecords.length > 0;
      setHasStagingRecords(hasRecords);
      return hasRecords;
    } catch (error: any) {
      console.error('Error checking staging records:', error);
      setHasStagingRecords(false);
      return false;
    } finally {
      setIsCheckingStagingRecords(false);
    }
  };

  const loadStagingRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Load all staging records for this organization
      const { data: stagingRecords, error } = await supabase
        .from('shipment_uploads_staging')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!stagingRecords || stagingRecords.length === 0) {
        setHasStagingRecords(false);
        toast({
          title: "No staging records found",
          description: "All previous uploads have been processed.",
        });
        return [];
      }

      console.log('Loading staging records:', stagingRecords.length);

      // Convert staging records to BulkUploadRecord format
      const convertedRecords: BulkUploadRecord[] = stagingRecords.map((record) => {
        console.log(`Converting staging record ${record.id}:`, {
          gbl_number: record.gbl_number,
          validation_status: record.validation_status,
          validation_warnings: record.validation_warnings
        });

        // Convert validation_errors from Json[] to string[]
        let errors: string[] = [];
        if (Array.isArray(record.validation_errors)) {
          errors = record.validation_errors.map(error => 
            typeof error === 'string' ? error : JSON.stringify(error)
          );
        }

        // Convert validation_warnings from Json[] to string[] - CRITICAL FIX
        let warnings: string[] = [];
        if (Array.isArray(record.validation_warnings)) {
          warnings = record.validation_warnings.map(warning => 
            typeof warning === 'string' ? warning : JSON.stringify(warning)
          );
        }

        console.log(`Converted warnings for ${record.gbl_number}:`, warnings);

        return {
          id: record.id,
          // Use REGULAR fields for validation and editing (these are the corrected values)
          gbl_number: record.gbl_number || '',
          shipper_last_name: record.shipper_last_name || '',
          shipment_type: record.shipment_type || '',
          origin_rate_area: record.origin_rate_area || '',
          destination_rate_area: record.destination_rate_area || '',
          pickup_date: record.pickup_date || '', // Use regular field, NOT raw
          rdd: record.rdd || '',
          poe_code: record.raw_poe_code || '', // These don't have regular equivalents yet
          pod_code: record.raw_pod_code || '',
          scac_code: record.raw_scac_code || '',
          estimated_cube: record.estimated_cube || '',
          actual_cube: record.actual_cube || '',
          
          // Determine status: if no errors and no pending status, it's valid
          status: errors.length === 0 && record.validation_status !== 'pending' ? 'valid' : 
                  record.validation_status === 'pending' ? 'pending' : 'invalid',
          errors,
          warnings, // Use the converted warnings from the database
          
          // Carry over resolved IDs if they exist
          target_poe_id: record.target_poe_id,
          target_pod_id: record.target_pod_id,
          tsp_id: record.tsp_id
        };
      });

      console.log('Converted records with warnings:', convertedRecords.filter(r => r.warnings && r.warnings.length > 0));

      // Return the converted records without re-validation since they're already validated
      return convertedRecords;

    } catch (error: any) {
      console.error('Error loading staging records:', error);
      throw error;
    }
  };

  const updateStagingRecord = async (recordId: string, updates: Partial<BulkUploadRecord>) => {
    try {
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

      // Update validation status and errors
      if (updates.status !== undefined) stagingUpdates.validation_status = updates.status;
      if (updates.errors !== undefined) stagingUpdates.validation_errors = updates.errors;
      
      // CRITICAL: Store warnings in staging table with the new column
      if (updates.warnings !== undefined) stagingUpdates.validation_warnings = updates.warnings;

      console.log(`Updating staging record ${recordId} with:`, stagingUpdates);

      const { error } = await supabase
        .from('shipment_uploads_staging')
        .update(stagingUpdates)
        .eq('id', recordId);

      if (error) throw error;

      console.log(`Successfully updated staging record ${recordId}`);

    } catch (error: any) {
      console.error('Error updating staging record:', error);
      throw error;
    }
  };

  const cleanupStagingRecords = async (recordIds: string[]) => {
    if (recordIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('shipment_uploads_staging')
        .delete()
        .in('id', recordIds);

      if (deleteError) {
        console.error('Cleanup error:', deleteError);
        // Don't throw here as the main operation succeeded
      } else {
        console.log('Cleaned up staging records:', recordIds.length);
      }
    }
  };

  const clearStagingState = () => {
    setHasStagingRecords(false);
  };

  return {
    hasStagingRecords,
    isCheckingStagingRecords,
    checkForStagingRecords,
    loadStagingRecords,
    updateStagingRecord,
    cleanupStagingRecords,
    clearStagingState
  };
};
