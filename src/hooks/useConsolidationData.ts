
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConsolidationGroup {
  poe_id: string;
  poe_name: string;
  poe_code: string;
  pod_id: string;
  pod_name: string;
  pod_code: string;
  shipment_count: number;
  total_cube: number;
  has_user_shipments: boolean;
}

export const useConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[]
) => {
  return useQuery({
    queryKey: ['consolidation-data', type, outlookDays[0]],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range - include past 30 days and future outlook days
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30); // Include past 30 days
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + outlookDays[0]);

      console.log('Consolidation query date range:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        type
      });

      // Build query for consolidation data with POE/POD information
      let query = supabase
        .from('shipments')
        .select(`
          target_poe_id,
          target_pod_id,
          actual_cube,
          estimated_cube,
          user_id,
          pickup_date,
          poe:target_poe_id(id, name, code),
          pod:target_pod_id(id, name, code)
        `)
        .eq('shipment_type', type)
        .gte('pickup_date', startDate.toISOString().split('T')[0])
        .lte('pickup_date', endDate.toISOString().split('T')[0]);

      const { data: shipments, error } = await query;

      if (error) throw error;

      console.log('Consolidation shipments found:', shipments?.length || 0, shipments);

      // Group shipments by POE/POD combinations
      const groupedData: { [key: string]: ConsolidationGroup } = {};

      shipments?.forEach((shipment) => {
        const poeData = shipment.poe as any;
        const podData = shipment.pod as any;
        
        // Skip shipments without proper POE/POD data
        if (!poeData || !podData) {
          console.warn('Skipping shipment without POE/POD data:', shipment);
          return;
        }

        const key = `${shipment.target_poe_id}-${shipment.target_pod_id}`;
        
        if (!groupedData[key]) {
          groupedData[key] = {
            poe_id: shipment.target_poe_id,
            poe_name: poeData.name || 'Unknown POE',
            poe_code: poeData.code || '',
            pod_id: shipment.target_pod_id,
            pod_name: podData.name || 'Unknown POD',
            pod_code: podData.code || '',
            shipment_count: 0,
            total_cube: 0,
            has_user_shipments: false
          };
        }

        groupedData[key].shipment_count += 1;
        groupedData[key].total_cube += shipment.actual_cube || shipment.estimated_cube || 0;
        
        if (shipment.user_id === user.id) {
          groupedData[key].has_user_shipments = true;
        }
      });

      const result = Object.values(groupedData);
      console.log('Consolidation groups by POE/POD:', result);
      return result;
    }
  });
};
