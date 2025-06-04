
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

  return {
    isProcessing,
    processValidShipments
  };
};
