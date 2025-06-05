
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BulkUploadRecord } from './bulkUploadTypes';
import { convertDateFormat } from './dateConverter';

type ShipmentType = 'inbound' | 'outbound' | 'intertheater';

/**
 * Service for processing valid records and inserting them into the shipments table
 */
export const useShipmentProcessor = () => {
  const { toast } = useToast();

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
    processValidRecords
  };
};
