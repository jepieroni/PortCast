
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/services/debugLogger';

export const fetchConsolidationShipments = async (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number
) => {
  console.log('🔍 fetchConsolidationShipments called:', { type, outlookDays });
  debugLogger.info('CONSOLIDATION-SERVICE', `Fetching ${type} shipments for ${outlookDays} days`, 'fetchConsolidationShipments');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + outlookDays);

  try {
    console.log('🔍 Step 1: Starting shipments query...');
    
    // First, fetch shipments with basic port data
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
      .limit(100);

    console.log('🔍 Step 2: Shipments query completed');

    if (shipmentsError) {
      console.error('❌ Error fetching shipments:', shipmentsError);
      debugLogger.error('CONSOLIDATION-SERVICE', 'Error fetching shipments', 'fetchConsolidationShipments', { error: shipmentsError });
      throw shipmentsError;
    }

    console.log('✅ Successfully fetched shipments:', shipments?.length || 0);

    if (!shipments || shipments.length === 0) {
      console.log('📭 No shipments found for consolidation');
      return [];
    }

    console.log('🔍 Step 3: Enriching with port region data...');
    
    // Get unique port IDs - properly typed as string[]
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
      return shipments.map(shipment => ({
        ...shipment,
        poe: {
          ...shipment.poe,
          port_region_memberships: []
        },
        pod: {
          ...shipment.pod,
          port_region_memberships: []
        }
      }));
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
    debugLogger.info('CONSOLIDATION-SERVICE', `Successfully processed ${enrichedShipments.length} shipments`, 'fetchConsolidationShipments');
    return enrichedShipments;

  } catch (error) {
    console.error('❌ Unexpected error in fetchConsolidationShipments:', error);
    debugLogger.error('CONSOLIDATION-SERVICE', 'Unexpected error in fetchConsolidationShipments', 'fetchConsolidationShipments', { error });
    throw error;
  }
};
