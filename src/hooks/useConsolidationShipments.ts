
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useConsolidationShipments = (
  type: 'inbound' | 'outbound' | 'intertheater',
  poeId: string,
  podId: string,
  outlookDays: number[],
  customConsolidationData?: any // For custom consolidations
) => {
  return useQuery({
    queryKey: ['consolidation-shipments', type, poeId, podId, outlookDays[0], customConsolidationData?.custom_id],
    queryFn: async () => {
      console.log('📊 Fetching consolidation shipments:', {
        type,
        poeId,
        podId,
        outlookDays: outlookDays[0],
        isCustom: !!customConsolidationData?.is_custom
      });

      // If this is a custom consolidation, we need to handle it differently
      if (customConsolidationData?.is_custom) {
        console.log('🔧 Processing custom consolidation:', customConsolidationData);
        
        // For custom consolidations, we need to fetch shipments for all combined original consolidations
        const allShipments = [];
        
        for (const originalConsolidation of customConsolidationData.combined_from) {
          console.log('📦 Fetching shipments for original consolidation:', originalConsolidation);
          
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + outlookDays[0]);

          let query = supabase
            .from('shipments')
            .select(`
              *,
              tsp:tsps(*),
              target_poe:ports!shipments_target_poe_id_fkey(*),
              target_pod:ports!shipments_target_pod_id_fkey(*)
            `)
            .eq('target_poe_id', originalConsolidation.poe_id)
            .eq('target_pod_id', originalConsolidation.pod_id)
            .gte('pickup_date', startDate.toISOString().split('T')[0])
            .lte('pickup_date', endDate.toISOString().split('T')[0]);

          // Apply shipment type filter
          if (type !== 'intertheater') {
            query = query.eq('shipment_type', type);
          } else {
            query = query.eq('shipment_type', 'intertheater');
          }

          const { data: shipments, error } = await query;

          if (error) {
            console.error('Error fetching shipments for original consolidation:', error);
            throw error;
          }

          if (shipments) {
            allShipments.push(...shipments);
          }
        }

        console.log(`✅ Retrieved ${allShipments.length} total shipments for custom consolidation`);
        return allShipments;
      }

      // Regular consolidation logic
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + outlookDays[0]);

      let query = supabase
        .from('shipments')
        .select(`
          *,
          tsp:tsps(*),
          target_poe:ports!shipments_target_poe_id_fkey(*),
          target_pod:ports!shipments_target_pod_id_fkey(*)
        `)
        .eq('target_poe_id', poeId)
        .eq('target_pod_id', podId)
        .gte('pickup_date', startDate.toISOString().split('T')[0])
        .lte('pickup_date', endDate.toISOString().split('T')[0]);

      // Apply shipment type filter
      if (type !== 'intertheater') {
        query = query.eq('shipment_type', type);
      } else {
        query = query.eq('shipment_type', 'intertheater');
      }

      const { data: shipments, error } = await query;

      if (error) {
        console.error('Error fetching consolidation shipments:', error);
        throw error;
      }

      console.log(`✅ Retrieved ${shipments?.length || 0} shipments`);
      return shipments || [];
    }
  });
};
