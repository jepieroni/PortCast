
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/services/debugLogger';

export const fetchConsolidationShipments = async (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number
) => {
  debugLogger.info('CONSOLIDATION-SERVICE', `Fetching ${type} shipments for ${outlookDays} days`, 'fetchConsolidationShipments');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + outlookDays);

  try {
    console.log('🔍 Step 1a: Starting custom consolidation memberships query...');
    
    // Simplified first query - remove the inner join which might be causing issues
    const customMembershipsResult = await Promise.race([
      supabase
        .from('custom_consolidation_memberships')
        .select(`
          shipment_id,
          custom_consolidations!inner(
            id,
            consolidation_type
          )
        `)
        .eq('custom_consolidations.consolidation_type', type),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Custom memberships query timeout after 15 seconds')), 15000)
      )
    ]) as any;

    const { data: customMembershipIds, error: membershipError } = customMembershipsResult;

    console.log('🔍 Step 1b: Custom memberships query completed');

    if (membershipError) {
      console.error('❌ Error fetching custom consolidation memberships:', membershipError);
      debugLogger.error('CONSOLIDATION-SERVICE', 'Error fetching custom consolidation memberships', 'fetchConsolidationShipments', { error: membershipError });
      throw membershipError;
    }

    console.log('✅ Step 1 complete - Custom memberships:', customMembershipIds?.length || 0);

    const excludeShipmentIds = customMembershipIds?.map(m => m.shipment_id) || [];
    debugLogger.debug('CONSOLIDATION-SERVICE', `Excluding ${excludeShipmentIds.length} shipments already in custom consolidations`, 'fetchConsolidationShipments');

    console.log('🔍 Step 2: Building main shipments query...');

    // Build the main query with timeout protection
    let query = supabase
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
          code,
          port_region_memberships(
            region:port_regions(id, name)
          )
        ),
        pod:ports!target_pod_id(
          id,
          name,
          code,
          port_region_memberships(
            region:port_regions(id, name)
          )
        )
      `)
      .eq('shipment_type', type)
      .lte('pickup_date', cutoffDate.toISOString().split('T')[0]);

    // Exclude shipments that are already in custom consolidations
    if (excludeShipmentIds.length > 0) {
      console.log('🔍 Step 2a: Adding exclusion filter for', excludeShipmentIds.length, 'shipments');
      query = query.not('id', 'in', `(${excludeShipmentIds.join(',')})`);
    }

    console.log('🔍 Step 3: Executing main query with timeout...');

    const shipmentsResult = await Promise.race([
      query,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Main shipments query timeout after 20 seconds')), 20000)
      )
    ]) as any;

    const { data: shipments, error } = shipmentsResult;

    console.log('🔍 Step 3a: Main query completed');

    if (error) {
      console.error('❌ Error fetching shipments:', error);
      debugLogger.error('CONSOLIDATION-SERVICE', 'Error fetching shipments', 'fetchConsolidationShipments', { error });
      throw error;
    }

    console.log('✅ Step 3 complete - Shipments fetched:', shipments?.length || 0);

    debugLogger.info('CONSOLIDATION-SERVICE', `Successfully fetched ${shipments?.length || 0} shipments`, 'fetchConsolidationShipments');
    return shipments || [];

  } catch (error) {
    console.error('❌ Unexpected error in fetchConsolidationShipments:', error);
    debugLogger.error('CONSOLIDATION-SERVICE', 'Unexpected error in fetchConsolidationShipments', 'fetchConsolidationShipments', { error });
    throw error;
  }
};
