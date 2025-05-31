
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConsolidationGroup {
  origin_rate_area: string;
  destination_rate_area: string;
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

      // Calculate date range based on outlook days
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + outlookDays[0]);

      // Build query for consolidation data
      let query = supabase
        .from('shipments')
        .select(`
          origin_rate_area,
          destination_rate_area,
          actual_cube,
          estimated_cube,
          user_id
        `)
        .eq('shipment_type', type)
        .gte('pickup_date', today.toISOString().split('T')[0])
        .lte('pickup_date', endDate.toISOString().split('T')[0]);

      const { data: shipments, error } = await query;

      if (error) throw error;

      // Group shipments by rate area combinations
      const groupedData: { [key: string]: ConsolidationGroup } = {};

      shipments?.forEach((shipment) => {
        const key = `${shipment.origin_rate_area}-${shipment.destination_rate_area}`;
        
        if (!groupedData[key]) {
          groupedData[key] = {
            origin_rate_area: shipment.origin_rate_area || 'Unknown',
            destination_rate_area: shipment.destination_rate_area || 'Unknown',
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

      return Object.values(groupedData);
    }
  });
};
