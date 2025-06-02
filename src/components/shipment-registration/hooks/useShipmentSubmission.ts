
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShipmentFormData } from '../types';

export const useShipmentSubmission = () => {
  const { toast } = useToast();

  const submitShipment = async (formData: ShipmentFormData): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to register a shipment.",
          variant: "destructive",
        });
        return false;
      }

      // Convert values to integers
      const estimatedCube = formData.estimatedCube ? parseInt(formData.estimatedCube) : null;
      const actualCube = formData.actualCube ? parseInt(formData.actualCube) : null;

      // If actual values are provided, copy them to remaining fields
      const remainingCube = actualCube !== null ? actualCube : null;

      const shipmentData = {
        user_id: user.id,
        gbl_number: formData.gblNumber,
        shipper_last_name: formData.shipperLastName,
        pickup_date: format(formData.pickupDate!, 'yyyy-MM-dd'),
        rdd: format(formData.rdd!, 'yyyy-MM-dd'),
        shipment_type: formData.shipmentType as 'inbound' | 'outbound' | 'intertheater',
        origin_rate_area: formData.originRateArea,
        destination_rate_area: formData.destinationRateArea,
        target_poe_id: formData.targetPoeId,
        target_pod_id: formData.targetPodId,
        tsp_id: formData.tspId,
        estimated_cube: estimatedCube,
        actual_cube: actualCube,
        remaining_cube: remainingCube
      };

      const { error } = await supabase
        .from('shipments')
        .insert([shipmentData]);

      if (error) {
        console.error('Shipment registration error:', error);
        toast({
          title: "Error",
          description: "Failed to register shipment. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Shipment Registered",
        description: "Your shipment has been successfully added to the system.",
      });
      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { submitShipment };
};
