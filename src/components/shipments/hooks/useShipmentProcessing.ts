
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
      
      // Insert valid records into shipments table with proper integer conversion
      const shipmentData = validRecords.map(record => {
        // Helper function to safely convert to integer
        const safeParseInt = (value: any): number | null => {
          if (value === null || value === undefined || value === '') {
            return null;
          }
          const parsed = parseInt(String(value), 10);
          return isNaN(parsed) ? null : parsed;
        };

        // Helper function to convert shipment type to proper enum value
        const convertShipmentType = (type: string): 'inbound' | 'outbound' | 'intertheater' => {
          const normalizedType = type?.toLowerCase().trim();
          switch (normalizedType) {
            case 'i':
            case 'inbound':
              return 'inbound';
            case 'o':
            case 'outbound':
              return 'outbound';
            case 't':
            case 'intertheater':
              return 'intertheater';
            default:
              console.warn(`🚀 SHIPMENT PROCESSING: Unknown shipment type "${type}", defaulting to inbound`);
              return 'inbound';
          }
        };

        console.log(`🚀 SHIPMENT PROCESSING: Converting values for ${record.gbl_number}:`, {
          raw_shipment_type: record.shipment_type,
          estimated_cube_raw: record.estimated_cube,
          actual_cube_raw: record.actual_cube,
          remaining_cube_raw: record.remaining_cube
        });

        const estimated_cube = safeParseInt(record.estimated_cube);
        const actual_cube = safeParseInt(record.actual_cube);
        const remaining_cube = safeParseInt(record.remaining_cube);
        const shipment_type = convertShipmentType(record.shipment_type);

        console.log(`🚀 SHIPMENT PROCESSING: Converted values for ${record.gbl_number}:`, {
          shipment_type,
          estimated_cube,
          actual_cube,
          remaining_cube
        });

        return {
          gbl_number: record.gbl_number,
          shipper_last_name: record.shipper_last_name,
          shipment_type,
          origin_rate_area: record.origin_rate_area,
          destination_rate_area: record.destination_rate_area,
          pickup_date: record.pickup_date,
          rdd: record.rdd,
          estimated_cube,
          actual_cube,
          remaining_cube,
          target_poe_id: record.target_poe_id,
          target_pod_id: record.target_pod_id,
          tsp_id: record.tsp_id,
          user_id: record.user_id
        };
      });

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
