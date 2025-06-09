
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConsolidationShipment {
  id: string;
  gbl_number: string;
  shipper_last_name: string;
  pickup_date: string;
  estimated_cube: number;
  actual_cube: number;
  tsp: {
    scac_code: string;
    name: string;
  };
}

export const useConsolidationShipments = (
  type: 'inbound' | 'outbound' | 'intertheater',
  poeId: string,
  podId: string,
  outlookDays: number[]
) => {
  return useQuery({
    queryKey: ['consolidation-shipments', type, poeId, podId, outlookDays[0]],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range - include past 30 days and future outlook days
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + outlookDays[0]);

      console.log('Consolidation shipments query:', {
        type,
        poeId,
        podId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          id,
          gbl_number,
          shipper_last_name,
          pickup_date,
          estimated_cube,
          actual_cube,
          tsp:tsp_id(scac_code, name)
        `)
        .eq('shipment_type', type)
        .eq('target_poe_id', poeId)
        .eq('target_pod_id', podId)
        .gte('pickup_date', startDate.toISOString().split('T')[0])
        .lte('pickup_date', endDate.toISOString().split('T')[0])
        .order('pickup_date', { ascending: true });

      if (error) throw error;

      console.log('Consolidation shipments found:', shipments?.length || 0);
      return shipments as ConsolidationShipment[];
    }
  });
};
