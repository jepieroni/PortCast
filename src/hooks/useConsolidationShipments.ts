
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/services/debugLogger';

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
        
        // Add detailed debug logging for custom consolidation data
        debugLogger.info('CONSOLIDATION-SHIPMENTS', 'Custom consolidation data received', 'useConsolidationShipments', {
          customId: customConsolidationData.custom_id,
          dbId: customConsolidationData.db_id,
          customType: customConsolidationData.custom_type,
          combinedFrom: customConsolidationData.combined_from,
          combinedFromCount: customConsolidationData.combined_from?.length || 0,
          shipmentCount: customConsolidationData.shipment_count,
          totalCube: customConsolidationData.total_cube,
          fullData: customConsolidationData
        });
        
        // Check if combined_from exists and has data
        if (!customConsolidationData.combined_from || customConsolidationData.combined_from.length === 0) {
          debugLogger.warn('CONSOLIDATION-SHIPMENTS', 'No combined_from data found in custom consolidation', 'useConsolidationShipments', {
            customConsolidationData
          });
          console.log('⚠️ No combined_from data found in custom consolidation');
          return [];
        }
        
        // For custom consolidations, we need to fetch shipments for all combined original consolidations
        const allShipments = [];
        
        for (const originalConsolidation of customConsolidationData.combined_from) {
          console.log('📦 Fetching shipments for original consolidation:', originalConsolidation);
          
          debugLogger.debug('CONSOLIDATION-SHIPMENTS', 'Processing original consolidation', 'useConsolidationShipments', {
            poeId: originalConsolidation.poe_id,
            podId: originalConsolidation.pod_id,
            poeCode: originalConsolidation.poe_code,
            podCode: originalConsolidation.pod_code,
            shipmentCount: originalConsolidation.shipment_count,
            totalCube: originalConsolidation.total_cube
          });
          
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
            debugLogger.error('CONSOLIDATION-SHIPMENTS', 'Error fetching shipments for original consolidation', 'useConsolidationShipments', {
              error: error.message,
              originalConsolidation
            });
            throw error;
          }

          if (shipments && shipments.length > 0) {
            console.log(`📦 Found ${shipments.length} shipments for ${originalConsolidation.poe_code} → ${originalConsolidation.pod_code}`);
            debugLogger.info('CONSOLIDATION-SHIPMENTS', 'Shipments found for original consolidation', 'useConsolidationShipments', {
              count: shipments.length,
              route: `${originalConsolidation.poe_code} → ${originalConsolidation.pod_code}`
            });
            allShipments.push(...shipments);
          } else {
            console.log(`📦 No shipments found for ${originalConsolidation.poe_code} → ${originalConsolidation.pod_code}`);
            debugLogger.warn('CONSOLIDATION-SHIPMENTS', 'No shipments found for original consolidation', 'useConsolidationShipments', {
              route: `${originalConsolidation.poe_code} → ${originalConsolidation.pod_code}`,
              dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
              type
            });
          }
        }

        console.log(`✅ Retrieved ${allShipments.length} total shipments for custom consolidation`);
        debugLogger.info('CONSOLIDATION-SHIPMENTS', 'Custom consolidation shipments fetch completed', 'useConsolidationShipments', {
          totalShipments: allShipments.length,
          customId: customConsolidationData.custom_id
        });
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
