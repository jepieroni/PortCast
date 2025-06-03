
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBulkUploadReview = (uploadSessionId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch staging data
  const { data: stagingData = [], refetch } = useQuery({
    queryKey: ['bulk-upload-staging', uploadSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_uploads_staging')
        .select('*')
        .eq('upload_session_id', uploadSessionId)
        .order('created_at');
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate validation summary
  const validationSummary = {
    total: stagingData.length,
    valid: stagingData.filter(r => r.validation_status === 'valid').length,
    invalid: stagingData.filter(r => r.validation_status === 'invalid').length,
    pending: stagingData.filter(r => r.validation_status === 'pending').length
  };

  const validateRecord = async (record: any) => {
    const errors: string[] = [];
    const updates: any = {};

    try {
      console.log('Validating record:', record.gbl_number);
      
      // Get user's organization for translations
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('User organization not found');
      }

      // Validate and translate rate areas
      for (const field of ['raw_origin_rate_area', 'raw_destination_rate_area']) {
        const rateAreaCode = record[field];
        if (!rateAreaCode) {
          errors.push(`${field.replace('raw_', '').replace('_', ' ')} is required`);
          continue;
        }

        const targetField = field.replace('raw_', '');
        
        // Check if rate area exists directly
        const { data: directRateArea } = await supabase
          .from('rate_areas')
          .select('rate_area')
          .eq('rate_area', rateAreaCode)
          .maybeSingle();

        if (directRateArea) {
          updates[targetField] = directRateArea.rate_area;
          continue;
        }

        // Check for translation
        const { data: translation } = await supabase
          .from('rate_area_translations')
          .select('rate_area_id')
          .eq('organization_id', profile.organization_id)
          .eq('external_rate_area_code', rateAreaCode)
          .maybeSingle();

        if (translation) {
          updates[targetField] = translation.rate_area_id;
        } else {
          errors.push(`Rate area '${rateAreaCode}' not found and no translation configured`);
        }
      }

      // Validate and translate ports
      for (const field of ['raw_poe_code', 'raw_pod_code']) {
        const portCode = record[field];
        if (!portCode) {
          errors.push(`${field.replace('raw_', '').replace('_', ' ')} is required`);
          continue;
        }

        const targetField = field.replace('raw_', '').replace('_code', '_id');
        
        // Check if port exists directly
        const { data: directPort } = await supabase
          .from('ports')
          .select('id')
          .eq('code', portCode)
          .maybeSingle();

        if (directPort) {
          updates[targetField] = directPort.id;
          continue;
        }

        // Check for translation
        const { data: translation } = await supabase
          .from('port_code_translations')
          .select('port_id')
          .eq('organization_id', profile.organization_id)
          .eq('external_port_code', portCode)
          .maybeSingle();

        if (translation) {
          updates[targetField] = translation.port_id;
        } else {
          errors.push(`Port code '${portCode}' not found and no translation configured`);
        }
      }

      // Validate and find TSP
      if (!record.raw_scac_code) {
        errors.push('SCAC code is required');
      } else {
        const { data: tsp } = await supabase
          .from('tsps')
          .select('id')
          .eq('scac_code', record.raw_scac_code)
          .eq('organization_id', profile.organization_id)
          .maybeSingle();

        if (tsp) {
          updates.tsp_id = tsp.id;
        } else {
          errors.push(`SCAC code '${record.raw_scac_code}' not found in your organization`);
        }
      }

      // Validate dates
      if (!record.pickup_date || !record.rdd) {
        if (!record.pickup_date) errors.push('Pickup date is required');
        if (!record.rdd) errors.push('RDD is required');
      } else {
        const pickupDate = new Date(record.pickup_date);
        const rddDate = new Date(record.rdd);
        
        if (isNaN(pickupDate.getTime())) {
          errors.push('Invalid pickup date format');
        }
        if (isNaN(rddDate.getTime())) {
          errors.push('Invalid RDD format');
        }
        
        if (!isNaN(pickupDate.getTime()) && !isNaN(rddDate.getTime()) && pickupDate > rddDate) {
          errors.push('Pickup date cannot be after RDD');
        }
      }

      // Validate required fields
      if (!record.gbl_number) errors.push('GBL number is required');
      if (!record.shipper_last_name) errors.push('Shipper last name is required');
      if (!record.shipment_type) errors.push('Shipment type is required');

      console.log('Validation complete for', record.gbl_number, 'errors:', errors.length);

      // Update record
      const { error: updateError } = await supabase
        .from('shipment_uploads_staging')
        .update({
          ...updates,
          validation_status: errors.length === 0 ? 'valid' : 'invalid',
          validation_errors: errors
        })
        .eq('id', record.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

    } catch (error: any) {
      console.error('Validation error for record', record.gbl_number, ':', error);
      errors.push(`Validation failed: ${error.message || 'System error'}`);
      
      await supabase
        .from('shipment_uploads_staging')
        .update({
          validation_status: 'invalid',
          validation_errors: errors
        })
        .eq('id', record.id);
    }
  };

  const validateAllRecords = useCallback(async () => {
    setIsValidating(true);
    try {
      console.log('Starting validation for', stagingData.length, 'records');
      
      // Validate each record
      for (const record of stagingData) {
        if (record.validation_status === 'pending') {
          await validateRecord(record);
        }
      }
      
      console.log('Validation complete, refreshing data');
      await refetch();
    } catch (error: any) {
      console.error('Batch validation error:', error);
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate some records",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  }, [stagingData, refetch, toast]);

  const processValidShipments = async () => {
    setIsProcessing(true);
    try {
      const validRecords = stagingData.filter(r => r.validation_status === 'valid');
      
      if (validRecords.length === 0) {
        throw new Error('No valid records to process');
      }

      console.log('Processing', validRecords.length, 'valid records');
      
      // Insert valid records into shipments table
      const shipmentData = validRecords.map(record => ({
        gbl_number: record.gbl_number,
        shipper_last_name: record.shipper_last_name,
        shipment_type: record.shipment_type,
        origin_rate_area: record.origin_rate_area,
        destination_rate_area: record.destination_rate_area,
        pickup_date: record.pickup_date,
        rdd: record.rdd,
        estimated_cube: record.estimated_cube,
        actual_cube: record.actual_cube,
        remaining_cube: record.remaining_cube,
        target_poe_id: record.target_poe_id,
        target_pod_id: record.target_pod_id,
        tsp_id: record.tsp_id,
        user_id: record.user_id
      }));

      const { error } = await supabase
        .from('shipments')
        .insert(shipmentData);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      // Clean up staging data for this session
      const { error: deleteError } = await supabase
        .from('shipment_uploads_staging')
        .delete()
        .eq('upload_session_id', uploadSessionId);

      if (deleteError) {
        console.error('Cleanup error:', deleteError);
        // Don't throw here as the main operation succeeded
      }

      // Invalidate shipments query to refresh the main table
      queryClient.invalidateQueries({ queryKey: ['shipments'] });

      console.log('Processing complete');

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process shipments",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshData = () => {
    refetch();
  };

  return {
    stagingData,
    validationSummary,
    isValidating,
    isProcessing,
    validateAllRecords,
    processValidShipments,
    refreshData
  };
};
