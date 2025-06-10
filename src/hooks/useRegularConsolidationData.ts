
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { processStrictGrouping } from './consolidation/strictGrouping';
import { useAuth } from './useAuth';
import { debugLogger } from '@/services/debugLogger';

export const useRegularConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[]
) => {
  const { user } = useAuth();
  
  // Calculate max outlook days directly without memoization
  const maxOutlookDays = Math.max(...outlookDays);

  console.log('🎯 useRegularConsolidationData called with:', { 
    type, 
    maxOutlookDays, 
    userId: user?.id,
    enabled: !!user?.id 
  });

  return useQuery({
    queryKey: ['regular-consolidation-data', type, maxOutlookDays, user?.id],
    queryFn: async () => {
      console.log('🔍 Starting regular consolidation data fetch...', { type, outlookDays: maxOutlookDays });
      
      if (!user?.id) {
        console.warn('⚠️ No user ID available for regular consolidation data query');
        return [];
      }

      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + maxOutlookDays);

        console.log('🔍 Step 1: Fetching shipments excluding custom consolidation members...');
        
        // First, fetch shipments excluding those that are part of custom consolidations
        const { data: shipments, error: shipmentsError } = await supabase
          .from('shipments')
          .select(`
            id,
            gbl_number,
            shipper_last_name,
            shipment_type,
            origin_rate_area,
            destination_rate_area,
            pickup_date,
            rdd,
            actual_cube,
            estimated_cube,
            remaining_cube,
            target_poe_id,
            target_pod_id,
            tsp_id,
            user_id,
            poe:ports!target_poe_id(
              id,
              name,
              code
            ),
            pod:ports!target_pod_id(
              id,
              name,
              code
            )
          `)
          .eq('shipment_type', type)
          .lte('pickup_date', cutoffDate.toISOString().split('T')[0])
          .not('id', 'in', `(SELECT shipment_id FROM custom_consolidation_memberships)`)
          .limit(100);

        console.log('🔍 Step 2: Shipments query completed');

        if (shipmentsError) {
          console.error('❌ Error fetching shipments:', shipmentsError);
          debugLogger.error('REGULAR-CONSOLIDATION-DATA', 'Error fetching shipments', 'useRegularConsolidationData', { error: shipmentsError });
          throw shipmentsError;
        }

        console.log('✅ Successfully fetched available shipments:', shipments?.length || 0);

        if (!shipments || shipments.length === 0) {
          console.log('📭 No available shipments found for regular consolidation');
          return [];
        }

        console.log('🔍 Step 3: Enriching with port region data...');
        
        // Get unique port IDs
        const portIds: string[] = [];
        shipments.forEach(s => {
          if (s.target_poe_id) portIds.push(s.target_poe_id);
          if (s.target_pod_id) portIds.push(s.target_pod_id);
        });

        // Remove duplicates
        const uniquePortIds = [...new Set(portIds)];
        console.log('🔍 Step 4: Found unique port IDs:', uniquePortIds.length);

        if (uniquePortIds.length === 0) {
          console.log('⚠️ No port IDs found in shipments');
          // Return shipments with empty port_region_memberships
          return processStrictGrouping(shipments.map(shipment => ({
            ...shipment,
            poe: {
              ...shipment.poe,
              port_region_memberships: []
            },
            pod: {
              ...shipment.pod,
              port_region_memberships: []
            }
          })), user.id);
        }

        // Fetch port region memberships
        const { data: portRegions, error: portRegionsError } = await supabase
          .from('port_region_memberships')
          .select(`
            port_id,
            region:port_regions(id, name)
          `)
          .in('port_id', uniquePortIds);

        console.log('🔍 Step 5: Port regions fetched:', portRegions?.length || 0);

        if (portRegionsError) {
          console.warn('⚠️ Error fetching port regions:', portRegionsError);
          // Continue without port regions
        }

        // Enrich shipments with port region data
        const enrichedShipments = shipments.map(shipment => ({
          ...shipment,
          poe: {
            ...shipment.poe,
            port_region_memberships: portRegions?.filter(pr => pr.port_id === shipment.target_poe_id) || []
          },
          pod: {
            ...shipment.pod,
            port_region_memberships: portRegions?.filter(pr => pr.port_id === shipment.target_pod_id) || []
          }
        }));

        console.log('✅ Enriched shipments with port regions');
        
        // Process shipments into consolidation groups using strict grouping
        console.log('⚙️ Processing regular consolidations...');
        const consolidations = processStrictGrouping(enrichedShipments, user.id);
        console.log('✅ Regular consolidations processed:', Array.isArray(consolidations) ? consolidations.length : 0);

        debugLogger.info('REGULAR-CONSOLIDATION-DATA', `Successfully processed ${consolidations.length} regular consolidations`, 'useRegularConsolidationData');
        return consolidations;

      } catch (error) {
        console.error('❌ Error in regular consolidation data query:', error);
        debugLogger.error('REGULAR-CONSOLIDATION-DATA', 'Unexpected error in useRegularConsolidationData', 'useRegularConsolidationData', { error });
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1
  });
};
