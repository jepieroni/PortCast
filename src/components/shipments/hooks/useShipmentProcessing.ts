
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useShipmentProcessing = (uploadSessionId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const processValidShipments = async (stagingData: any[]) => {
    setIsProcessing(true);
    try {
      console.log(`🚀 SHIPMENT PROCESSING: === PROCESS VALID SHIPMENTS START ===`);
      console.log(`🚀 SHIPMENT PROCESSING: Total staging records received:`, stagingData.length);
      
      // Log each record's status
      stagingData.forEach((record, index) => {
        console.log(`🚀 SHIPMENT PROCESSING: Record ${index + 1}: ID=${record.id}, GBL=${record.gbl_number}, Status=${record.validation_status}, Warnings=${record.validation_warnings?.length || 0}, ApprovedWarnings=${record.approved_warnings?.length || 0}`);
      });
      
      const validRecords = stagingData.filter(r => r.validation_status === 'valid');
      console.log(`🚀 SHIPMENT PROCESSING: Valid records found:`, validRecords.length);
      
      if (validRecords.length === 0) {
        console.log(`🚀 SHIPMENT PROCESSING: No valid records to process`);
        throw new Error('No valid records to process');
      }

      console.log(`🚀 SHIPMENT PROCESSING: Processing ${validRecords.length} valid records`);
      
      // Log details of valid records
      validRecords.forEach((record, index) => {
        console.log(`🚀 SHIPMENT PROCESSING: Valid record ${index + 1}: GBL=${record.gbl_number}, ApprovedWarnings=${record.approved_warnings?.length || 0}, ValidationWarnings=${record.validation_warnings?.length || 0}`);
      });
      
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

      console.log(`🚀 SHIPMENT PROCESSING: Prepared shipment data for insertion:`, shipmentData);

      const { error } = await supabase
        .from('shipments')
        .insert(shipmentData);

      if (error) {
        console.error('🚀 SHIPMENT PROCESSING: Insert error:', error);
        throw error;
      }

      console.log(`🚀 SHIPMENT PROCESSING: Successfully inserted ${shipmentData.length} shipments`);

      // Clean up staging data for this session
      const { error: deleteError } = await supabase
        .from('shipment_uploads_staging')
        .delete()
        .eq('upload_session_id', uploadSessionId);

      if (deleteError) {
        console.error('🚀 SHIPMENT PROCESSING: Cleanup error:', deleteError);
        // Don't throw here as the main operation succeeded
      } else {
        console.log(`🚀 SHIPMENT PROCESSING: Successfully cleaned up staging data`);
      }

      // Invalidate shipments query to refresh the main table
      queryClient.invalidateQueries({ queryKey: ['shipments'] });

      console.log('🚀 SHIPMENT PROCESSING: === PROCESS VALID SHIPMENTS END ===');

    } catch (error: any) {
      console.error('🚀 SHIPMENT PROCESSING: Processing error:', error);
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

  return {
    isProcessing,
    processValidShipments
  };
};
