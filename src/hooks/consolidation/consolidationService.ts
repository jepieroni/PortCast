
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
    // First get all shipment IDs that are already part of custom consolidations
    const { data: customMembershipIds, error: membershipError } = await supabase
      .from('custom_consolidation_memberships')
      .select(`
        shipment_id,
        custom_consolidations!inner(consolidation_type)
      `)
      .eq('custom_consolidations.consolidation_type', type);

    if (membershipError) {
      debugLogger.error('CONSOLIDATION-SERVICE', 'Error fetching custom consolidation memberships', 'fetchConsolidationShipments', { error: membershipError });
    }

    const excludeShipmentIds = customMembershipIds?.map(m => m.shipment_id) || [];
    debugLogger.debug('CONSOLIDATION-SERVICE', `Excluding ${excludeShipmentIds.length} shipments already in custom consolidations`, 'fetchConsolidationShipments');

    // Build the main query
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
      query = query.not('id', 'in', `(${excludeShipmentIds.join(',')})`);
    }

    const { data: shipments, error } = await query;

    if (error) {
      debugLogger.error('CONSOLIDATION-SERVICE', 'Error fetching shipments', 'fetchConsolidationShipments', { error });
      throw error;
    }

    debugLogger.info('CONSOLIDATION-SERVICE', `Successfully fetched ${shipments?.length || 0} shipments`, 'fetchConsolidationShipments');
    return shipments || [];

  } catch (error) {
    debugLogger.error('CONSOLIDATION-SERVICE', 'Unexpected error in fetchConsolidationShipments', 'fetchConsolidationShipments', { error });
    throw error;
  }
};
