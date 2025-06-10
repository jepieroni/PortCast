
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
    console.log('🔍 Step 1: Starting simplified shipments query...');
    
    // Simplified approach - just get shipments first without complex joins
    const { data: shipments, error } = await supabase
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
      .limit(100); // Add limit to prevent huge queries

    console.log('🔍 Step 2: Shipments query completed');

    if (error) {
      console.error('❌ Error fetching shipments:', error);
      debugLogger.error('CONSOLIDATION-SERVICE', 'Error fetching shipments', 'fetchConsolidationShipments', { error });
      throw error;
    }

    console.log('✅ Successfully fetched shipments:', shipments?.length || 0);

    // Add port region data if we have shipments
    if (shipments && shipments.length > 0) {
      console.log('🔍 Step 3: Adding port region data...');
      
      // Get unique port IDs
      const portIds = new Set();
      shipments.forEach(s => {
        if (s.target_poe_id) portIds.add(s.target_poe_id);
        if (s.target_pod_id) portIds.add(s.target_pod_id);
      });

      // Fetch port region memberships
      const { data: portRegions } = await supabase
        .from('port_region_memberships')
        .select(`
          port_id,
          region:port_regions(id, name)
        `)
        .in('port_id', Array.from(portIds));

      console.log('🔍 Step 4: Port regions fetched:', portRegions?.length || 0);

      // Add region data to shipments
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
    }

    debugLogger.info('CONSOLIDATION-SERVICE', `No shipments found for ${type}`, 'fetchConsolidationShipments');
    return shipments || [];

  } catch (error) {
    console.error('❌ Unexpected error in fetchConsolidationShipments:', error);
    debugLogger.error('CONSOLIDATION-SERVICE', 'Unexpected error in fetchConsolidationShipments', 'fetchConsolidationShipments', { error });
    throw error;
  }
};
