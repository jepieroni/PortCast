
import { supabase } from '@/integrations/supabase/client';
import { DatabaseCustomConsolidation, CustomConsolidationGroup } from './customConsolidationTypes';
import { debugLogger } from '@/services/debugLogger';

export const convertDbToUIFormat = async (dbConsolidations: DatabaseCustomConsolidation[]): Promise<CustomConsolidationGroup[]> => {
  debugLogger.info('CUSTOM-CONSOLIDATION-CONVERTER', 'Converting database consolidations to UI format', 'convertDbToUIFormat', {
    count: dbConsolidations.length
  });

  const uiConsolidations: CustomConsolidationGroup[] = [];

  for (const dbRecord of dbConsolidations) {
    debugLogger.debug('CUSTOM-CONSOLIDATION-CONVERTER', 'Processing database record', 'convertDbToUIFormat', {
      id: dbRecord.id,
      consolidationType: dbRecord.consolidation_type
    });

    // Fetch membership data to get shipment details and counts
    const { data: memberships, error: membershipError } = await supabase
      .from('custom_consolidation_memberships')
      .select(`
        shipment_id,
        shipments:shipment_id (
          id,
          gbl_number,
          shipper_last_name,
          estimated_cube,
          actual_cube,
          remaining_cube,
          pickup_date,
          rdd,
          shipment_type,
          origin_rate_area,
          destination_rate_area,
          target_poe_id,
          target_pod_id,
          tsp_id,
          user_id
        )
      `)
      .eq('custom_consolidation_id', dbRecord.id);

    if (membershipError) {
      debugLogger.error('CUSTOM-CONSOLIDATION-CONVERTER', 'Error fetching membership data', 'convertDbToUIFormat', {
        error: membershipError,
        consolidationId: dbRecord.id
      });
    }

    const shipmentDetails = memberships?.map(m => m.shipments).filter(Boolean) || [];
    const totalCube = shipmentDetails.reduce((sum, shipment) => sum + (shipment.estimated_cube || shipment.actual_cube || 0), 0);
    const shipmentCount = shipmentDetails.length;

    debugLogger.debug('CUSTOM-CONSOLIDATION-CONVERTER', 'Calculated totals from memberships', 'convertDbToUIFormat', {
      consolidationId: dbRecord.id,
      shipmentCount,
      totalCube
    });

    // Determine custom type based on whether we're using regions or ports
    let customType: CustomConsolidationGroup['custom_type'];
    if (dbRecord.origin_region_id && dbRecord.destination_region_id) {
      customType = 'region_to_region';
    } else if (dbRecord.origin_region_id) {
      customType = 'region_to_port';
    } else if (dbRecord.destination_region_id) {
      customType = 'port_to_region';
    } else {
      customType = 'port_to_port';
    }

    // Build port/region names safely
    const poe_name = dbRecord.origin_region_id 
      ? `Region: ${dbRecord.origin_region?.name || 'Unknown Region'}`
      : dbRecord.origin_port?.name || 'Unknown Port';
    
    const pod_name = dbRecord.destination_region_id
      ? `Region: ${dbRecord.destination_region?.name || 'Unknown Region'}`
      : dbRecord.destination_port?.name || 'Unknown Port';

    const poe_code = dbRecord.origin_port?.code || '';
    const pod_code = dbRecord.destination_port?.code || '';

    // Check if any shipments belong to the current user
    const hasUserShipments = shipmentDetails.some(shipment => shipment.user_id === dbRecord.created_by);

    // Calculate how many unique route combinations were combined
    const uniqueRoutes = new Set();
    shipmentDetails.forEach(shipment => {
      uniqueRoutes.add(`${shipment.target_poe_id}-${shipment.target_pod_id}`);
    });
    const combinedCardsCount = uniqueRoutes.size;

    debugLogger.debug('CUSTOM-CONSOLIDATION-CONVERTER', 'Calculated combined cards count', 'convertDbToUIFormat', {
      consolidationId: dbRecord.id,
      uniqueRoutesCount: combinedCardsCount,
      totalShipments: shipmentCount
    });

    const uiRecord: CustomConsolidationGroup = {
      poe_id: dbRecord.origin_port_id || dbRecord.origin_region_id || '',
      poe_name,
      poe_code,
      pod_id: dbRecord.destination_port_id || dbRecord.destination_region_id || '',
      pod_name,
      pod_code,
      shipment_count: shipmentCount,
      total_cube: totalCube,
      has_user_shipments: hasUserShipments,
      is_custom: true,
      custom_type: customType,
      origin_region_id: dbRecord.origin_region_id,
      origin_region_name: dbRecord.origin_region?.name,
      destination_region_id: dbRecord.destination_region_id,
      destination_region_name: dbRecord.destination_region?.name,
      combined_from: [], // This will be populated with the original consolidation groups that were combined
      combined_cards_count: combinedCardsCount, // Add this to track how many cards were combined
      shipment_details: shipmentDetails,
      custom_id: `custom-${dbRecord.id}`,
      db_id: dbRecord.id
    };

    debugLogger.info('CUSTOM-CONSOLIDATION-CONVERTER', 'Converted database record to UI format', 'convertDbToUIFormat', {
      customId: uiRecord.custom_id,
      customType: uiRecord.custom_type,
      shipmentCount: uiRecord.shipment_count,
      totalCube: uiRecord.total_cube,
      combinedCardsCount: uiRecord.combined_cards_count
    });

    uiConsolidations.push(uiRecord);
  }

  debugLogger.info('CUSTOM-CONSOLIDATION-CONVERTER', 'Completed conversion of all records', 'convertDbToUIFormat', {
    totalConverted: uiConsolidations.length
  });

  return uiConsolidations;
};
