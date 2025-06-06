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
      console.log(`🚀 SHIPMENT PROCESSING: Upload session ID for cleanup:`, uploadSessionId);
      
      // Log each record's status AND user_id
      stagingData.forEach((record, index) => {
        console.log(`🚀 SHIPMENT PROCESSING: Record ${index + 1}: ID=${record.id}, GBL=${record.gbl_number}, Status=${record.validation_status}, Warnings=${record.validation_warnings?.length || 0}, ApprovedWarnings=${record.approved_warnings?.length || 0}, USER_ID=${record.user_id}`);
      });
      
      const validRecords = stagingData.filter(r => r.validation_status === 'valid');
      console.log(`🚀 SHIPMENT PROCESSING: Valid records found:`, validRecords.length);
      
      if (validRecords.length === 0) {
        console.log(`🚀 SHIPMENT PROCESSING: No valid records to process`);
        throw new Error('No valid records to process');
      }

      console.log(`🚀 SHIPMENT PROCESSING: Processing ${validRecords.length} valid records`);
      
      // Log details of valid records including user_id
      validRecords.forEach((record, index) => {
        console.log(`🚀 SHIPMENT PROCESSING: Valid record ${index + 1}: GBL=${record.gbl_number}, ApprovedWarnings=${record.approved_warnings?.length || 0}, ValidationWarnings=${record.validation_warnings?.length || 0}, USER_ID=${record.user_id}, USER_ID_TYPE=${typeof record.user_id}`);
      });
      
      // Get current user info for fallback
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log(`🚀 SHIPMENT PROCESSING: Current authenticated user:`, {
        user_id: user?.id,
        user_email: user?.email,
        userError: userError
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
          remaining_cube_raw: record.remaining_cube,
          record_user_id: record.user_id,
          record_user_id_type: typeof record.user_id
        });

        const estimated_cube = safeParseInt(record.estimated_cube);
        const actual_cube = safeParseInt(record.actual_cube);
        const remaining_cube = safeParseInt(record.remaining_cube);
        const shipment_type = convertShipmentType(record.shipment_type);

        // CRITICAL: Determine user_id - use record's user_id or fallback to current user
        const final_user_id = record.user_id || user?.id;
        
        console.log(`🚀 SHIPMENT PROCESSING: USER_ID RESOLUTION for ${record.gbl_number}:`, {
          record_user_id: record.user_id,
          current_user_id: user?.id,
          final_user_id: final_user_id,
          final_user_id_type: typeof final_user_id
        });

        console.log(`🚀 SHIPMENT PROCESSING: Converted values for ${record.gbl_number}:`, {
          shipment_type,
          estimated_cube,
          actual_cube,
          remaining_cube,
          final_user_id
        });

        const shipmentRecord = {
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
          user_id: final_user_id
        };

        console.log(`🚀 SHIPMENT PROCESSING: Final shipment record for ${record.gbl_number}:`, shipmentRecord);

        return shipmentRecord;
      });

      console.log(`🚀 SHIPMENT PROCESSING: Prepared shipment data for insertion:`, shipmentData);

      // Additional validation before insert
      shipmentData.forEach((shipment, index) => {
        const nullFields = Object.entries(shipment).filter(([key, value]) => value === null || value === undefined);
        if (nullFields.length > 0) {
          console.warn(`🚀 SHIPMENT PROCESSING: Warning - Record ${index + 1} has null fields:`, nullFields);
        }
      });

      const { error } = await supabase
        .from('shipments')
        .insert(shipmentData);

      if (error) {
        console.error('🚀 SHIPMENT PROCESSING: Insert error:', error);
        throw error;
      }

      console.log(`🚀 SHIPMENT PROCESSING: Successfully inserted ${shipmentData.length} shipments`);

      // Enhanced cleanup logging - check what records exist before cleanup
      console.log(`🚀 SHIPMENT PROCESSING: Starting cleanup for upload_session_id: ${uploadSessionId}`);
      
      // First, check what staging records exist for this session
      const { data: stagingRecordsForSession, error: checkError } = await supabase
        .from('shipment_uploads_staging')
        .select('id, upload_session_id, gbl_number')
        .eq('upload_session_id', uploadSessionId);
        
      if (checkError) {
        console.error('🚀 SHIPMENT PROCESSING: Error checking staging records for cleanup:', checkError);
      } else {
        console.log(`🚀 SHIPMENT PROCESSING: Found ${stagingRecordsForSession?.length || 0} staging records with matching upload_session_id:`, stagingRecordsForSession);
      }

      // Also check if any of the processed records have different upload_session_ids
      const processedRecordIds = validRecords.map(r => r.id);
      const { data: processedStagingRecords, error: processedCheckError } = await supabase
        .from('shipment_uploads_staging')
        .select('id, upload_session_id, gbl_number')
        .in('id', processedRecordIds);
        
      if (processedCheckError) {
        console.error('🚀 SHIPMENT PROCESSING: Error checking processed staging records:', processedCheckError);
      } else {
        console.log(`🚀 SHIPMENT PROCESSING: Upload session IDs of processed records:`, processedStagingRecords);
      }

      // Clean up staging data for this session
      const { error: deleteError } = await supabase
        .from('shipment_uploads_staging')
        .delete()
        .eq('upload_session_id', uploadSessionId);

      if (deleteError) {
        console.error('🚀 SHIPMENT PROCESSING: Cleanup error:', deleteError);
        // Don't throw here as the main operation succeeded
      } else {
        console.log(`🚀 SHIPMENT PROCESSING: Successfully cleaned up staging data for session ${uploadSessionId}`);
        
        // Verify cleanup worked
        const { data: remainingRecords, error: verifyError } = await supabase
          .from('shipment_uploads_staging')
          .select('id, upload_session_id, gbl_number')
          .eq('upload_session_id', uploadSessionId);
          
        if (!verifyError) {
          console.log(`🚀 SHIPMENT PROCESSING: Remaining records after cleanup: ${remainingRecords?.length || 0}`, remainingRecords);
        }
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
