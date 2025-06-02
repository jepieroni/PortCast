
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useShipmentActions = () => {
  const { toast } = useToast();

  const updateShipment = async (shipmentId: string, data: any) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          gbl_number: data.gbl_number,
          shipper_last_name: data.shipper_last_name,
          shipment_type: data.shipment_type,
          origin_rate_area: data.origin_rate_area,
          destination_rate_area: data.destination_rate_area,
          pickup_date: data.pickup_date,
          rdd: data.rdd,
          estimated_cube: data.estimated_cube ? parseInt(data.estimated_cube) : null,
          actual_cube: data.actual_cube ? parseInt(data.actual_cube) : null,
          remaining_cube: data.remaining_cube ? parseInt(data.remaining_cube) : null,
          estimated_pieces: data.estimated_pieces ? parseInt(data.estimated_pieces) : null,
          actual_pieces: data.actual_pieces ? parseInt(data.actual_pieces) : null,
          remaining_pieces: data.remaining_pieces ? parseInt(data.remaining_pieces) : null,
          target_poe_id: data.target_poe_id || null,
          target_pod_id: data.target_pod_id || null,
          tsp_id: data.tsp_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipment updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to update shipment",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteShipment = async (shipmentId: string) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipment deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting shipment:', error);
      toast({
        title: "Error",
        description: "Failed to delete shipment",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    updateShipment,
    deleteShipment,
  };
};
