
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
      // Get user's organization for translations
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();

      // Validate and translate rate areas
      for (const field of ['raw_origin_rate_area', 'raw_destination_rate_area']) {
        const rateAreaCode = record[field];
        const targetField = field.replace('raw_', '');
        
        // Check if rate area exists directly
        const { data: directRateArea } = await supabase
          .from('rate_areas')
          .select('rate_area')
          .eq('rate_area', rateAreaCode)
          .single();

        if (directRateArea) {
          updates[targetField] = directRateArea.rate_area;
          continue;
        }

        // Check for translation
        const { data: translation } = await supabase
          .from('rate_area_translations')
          .select('rate_area_id')
          .eq('organization_id', profile!.organization_id)
          .eq('external_rate_area_code', rateAreaCode)
          .single();

        if (translation) {
          updates[targetField] = translation.rate_area_id;
        } else {
          errors.push(`Rate area '${rateAreaCode}' not found and no translation configured`);
        }
      }

      // Validate and translate ports
      for (const field of ['raw_poe_code', 'raw_pod_code']) {
        const portCode = record[field];
        const targetField = field.replace('raw_', '').replace('_code', '_id');
        
        // Check if port exists directly
        const { data: directPort } = await supabase
          .from('ports')
          .select('id')
          .eq('code', portCode)
          .single();

        if (directPort) {
          updates[targetField] = directPort.id;
          continue;
        }

        // Check for translation
        const { data: translation } = await supabase
          .from('port_code_translations')
          .select('port_id')
          .eq('organization_id', profile!.organization_id)
          .eq('external_port_code', portCode)
          .single();

        if (translation) {
          updates[targetField] = translation.port_id;
        } else {
          errors.push(`Port code '${portCode}' not found and no translation configured`);
        }
      }

      // Validate and find TSP
      const { data: tsp } = await supabase
        .from('tsps')
        .select('id')
        .eq('scac_code', record.raw_scac_code)
        .eq('organization_id', profile!.organization_id)
        .single();

      if (tsp) {
        updates.tsp_id = tsp.id;
      } else {
        errors.push(`SCAC code '${record.raw_scac_code}' not found in your organization`);
      }

      // Validate dates
      if (new Date(record.pickup_date) > new Date(record.rdd)) {
        errors.push('Pickup date cannot be after RDD');
      }

      // Update record
      const { error: updateError } = await supabase
        .from('shipment_uploads_staging')
        .update({
          ...updates,
          validation_status: errors.length === 0 ? 'valid' : 'invalid',
          validation_errors: errors
        })
        .eq('id', record.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Validation error:', error);
      errors.push('Validation failed due to system error');
      
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
      // Validate each record
      for (const record of stagingData) {
        if (record.validation_status === 'pending') {
          await validateRecord(record);
        }
      }
      await refetch();
    } catch (error) {
      console.error('Batch validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate some records",
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

      if (error) throw error;

      // Clean up staging data for this session
      await supabase
        .from('shipment_uploads_staging')
        .delete()
        .eq('upload_session_id', uploadSessionId);

      // Invalidate shipments query to refresh the main table
      queryClient.invalidateQueries({ queryKey: ['shipments'] });

    } catch (error: any) {
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
