
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

        console.log('🔍 Step 1: Getting shipment IDs that are in custom consolidations...');
        
        // First, get all shipment IDs that are part of custom consolidations
        const { data: customMembershipIds, error: membershipError } = await supabase
          .from('custom_consolidation_memberships')
          .select('shipment_id');

        if (membershipError) {
          console.error('❌ Error fetching custom consolidation memberships:', membershipError);
          debugLogger.error('REGULAR-CONSOLIDATION-DATA', 'Error fetching custom consolidation memberships', 'useRegularConsolidationData', { error: membershipError });
          // Continue without exclusions rather than failing
        }

        const excludedShipmentIds = customMembershipIds?.map(m => m.shipment_id) || [];
        console.log('🔍 Step 2: Found shipment IDs in custom consolidations:', excludedShipmentIds.length);

        console.log('🔍 Step 3: Fetching available shipments...');
        
        // Build the query for shipments
        let shipmentsQuery = supabase
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
          .limit(100);

        // Only exclude shipments if there are any to exclude
        if (excludedShipmentIds.length > 0) {
          shipmentsQuery = shipmentsQuery.not('id', 'in', `(${excludedShipmentIds.map(id => `"${id}"`).join(',')})`);
        }

        const { data: shipments, error: shipmentsError } = await shipmentsQuery;

        console.log('🔍 Step 4: Shipments query completed');
        console.log('🔍 DETAILED SHIPMENT DATA:', {
          totalShipments: shipments?.length || 0,
          firstFewShipments: shipments?.slice(0, 3).map(s => ({
            id: s.id,
            gbl: s.gbl_number,
            shipment_type: s.shipment_type,
            pickup_date: s.pickup_date,
            poe_id: s.target_poe_id,
            pod_id: s.target_pod_id,
            poe_name: s.poe?.name,
            pod_name: s.pod?.name,
            cube: s.actual_cube || s.estimated_cube
          })) || []
        });

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

        console.log('🔍 Step 5: Enriching with port region data...');
        
        // Get unique port IDs
        const portIds: string[] = [];
        shipments.forEach(s => {
          if (s.target_poe_id) portIds.push(s.target_poe_id);
          if (s.target_pod_id) portIds.push(s.target_pod_id);
        });

        // Remove duplicates
        const uniquePortIds = [...new Set(portIds)];
        console.log('🔍 Step 6: Found unique port IDs:', uniquePortIds.length);

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

        console.log('🔍 Step 7: Port regions fetched:', portRegions?.length || 0);

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
        console.log('🔍 SAMPLE ENRICHED SHIPMENT:', enrichedShipments[0] ? {
          id: enrichedShipments[0].id,
          gbl: enrichedShipments[0].gbl_number,
          poe_regions: enrichedShipments[0].poe?.port_region_memberships,
          pod_regions: enrichedShipments[0].pod?.port_region_memberships
        } : 'none');
        
        // Process shipments into consolidation groups using strict grouping
        console.log('⚙️ Processing regular consolidations...');
        const consolidations = processStrictGrouping(enrichedShipments, user.id);
        console.log('✅ Regular consolidations processed:', Array.isArray(consolidations) ? consolidations.length : 0);
        
        // Log the first few consolidations in detail
        console.log('🔍 SAMPLE CONSOLIDATIONS:', consolidations.slice(0, 2).map(c => ({
          poe_id: c.poe_id,
          pod_id: c.pod_id,
          poe_name: c.poe_name,
          pod_name: c.pod_name,
          shipment_count: c.shipment_count,
          total_cube: c.total_cube,
          has_user_shipments: c.has_user_shipments
        })));

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
