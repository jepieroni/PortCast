
import { useCallback } from 'react';
import { ExtendedConsolidationGroup } from './dragDropTypes';
import { CustomConsolidationGroup } from '../useCustomConsolidations';

export const useCustomConsolidationCreator = (getPortRegion: (portId: string) => { id: string; name: string } | null) => {
  const createCustomCard = useCallback((cards: ExtendedConsolidationGroup[]): CustomConsolidationGroup => {
    console.log('🎯 [CARD-CREATOR] createCustomCard called with', cards.length, 'cards');
    
    if (cards.length < 2) {
      console.error('❌ [CARD-CREATOR] Insufficient cards provided:', cards.length);
      throw new Error('At least 2 cards required for consolidation');
    }

    console.log('📊 [CARD-CREATOR] Input cards:', cards.map(card => ({
      poeId: card.poe_id,
      poeName: card.poe_name,
      podId: card.pod_id,
      podName: card.pod_name,
      shipmentCount: card.shipment_count,
      isCustom: 'is_custom' in card
    })));

    const firstCard = cards[0];
    const firstOriginRegion = getPortRegion(firstCard.poe_id);
    const firstDestRegion = getPortRegion(firstCard.pod_id);

    console.log('🗺️ [CARD-CREATOR] First card regions:', {
      originRegion: firstOriginRegion,
      destRegion: firstDestRegion
    });

    // Determine consolidation type based on regions
    let customType: CustomConsolidationGroup['custom_type'];
    let poe_name: string, poe_code: string, pod_name: string, pod_code: string;
    let origin_region_id: string | undefined, origin_region_name: string | undefined;
    let destination_region_id: string | undefined, destination_region_name: string | undefined;

    // Check if all cards have the same origin and destination regions
    const allSameOriginRegion = cards.every(card => {
      const originRegion = getPortRegion(card.poe_id);
      const isSame = originRegion?.id === firstOriginRegion?.id;
      console.log('🔍 [CARD-CREATOR] Card origin region check:', {
        cardPoeId: card.poe_id,
        cardOriginRegion: originRegion,
        firstOriginRegion,
        isSame
      });
      return isSame;
    });

    const allSameDestRegion = cards.every(card => {
      const destRegion = getPortRegion(card.pod_id);
      const isSame = destRegion?.id === firstDestRegion?.id;
      console.log('🔍 [CARD-CREATOR] Card dest region check:', {
        cardPodId: card.pod_id,
        cardDestRegion: destRegion,
        firstDestRegion,
        isSame
      });
      return isSame;
    });

    console.log('🔍 [CARD-CREATOR] Region compatibility:', {
      allSameOriginRegion,
      allSameDestRegion
    });

    if (allSameOriginRegion && allSameDestRegion) {
      customType = 'region_to_region';
      poe_name = `Region: ${firstOriginRegion!.name}`;
      poe_code = '';
      pod_name = `Region: ${firstDestRegion!.name}`;
      pod_code = '';
      origin_region_id = firstOriginRegion!.id;
      origin_region_name = firstOriginRegion!.name;
      destination_region_id = firstDestRegion!.id;
      destination_region_name = firstDestRegion!.name;
    } else if (allSameOriginRegion) {
      customType = 'region_to_port';
      poe_name = `Region: ${firstOriginRegion!.name}`;
      poe_code = '';
      pod_name = `Region: ${firstDestRegion!.name}`;
      pod_code = '';
      origin_region_id = firstOriginRegion!.id;
      origin_region_name = firstOriginRegion!.name;
      destination_region_id = firstDestRegion!.id;
      destination_region_name = firstDestRegion!.name;
    } else if (allSameDestRegion) {
      customType = 'port_to_region';
      poe_name = `Region: ${firstOriginRegion!.name}`;
      poe_code = '';
      pod_name = `Region: ${firstDestRegion!.name}`;
      pod_code = '';
      origin_region_id = firstOriginRegion!.id;
      origin_region_name = firstOriginRegion!.name;
      destination_region_id = firstDestRegion!.id;
      destination_region_name = firstDestRegion!.name;
    } else {
      customType = 'port_to_port';
      poe_name = firstCard.poe_name;
      poe_code = firstCard.poe_code;
      pod_name = firstCard.pod_name;
      pod_code = firstCard.pod_code;
    }

    console.log('🏷️ [CARD-CREATOR] Determined custom type:', customType);

    // Collect all shipment details from all cards
    const getShipmentDetails = (consolidation: ExtendedConsolidationGroup): any[] => {
      if ('is_custom' in consolidation) {
        return consolidation.shipment_details || [];
      }
      return [];
    };

    const combinedShipments = cards.flatMap(card => getShipmentDetails(card));

    const customId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate totals
    const totalShipments = cards.reduce((sum, card) => sum + card.shipment_count, 0);
    const totalCube = cards.reduce((sum, card) => sum + card.total_cube, 0);
    const hasUserShipments = cards.some(card => card.has_user_shipments);

    // Flatten all combined_from arrays
    const allCombinedFrom = cards.flatMap(card => 
      ('is_custom' in card) ? card.combined_from : [card]
    );

    const result = {
      poe_id: firstCard.poe_id,
      poe_name,
      poe_code,
      pod_id: firstCard.pod_id,
      pod_name,
      pod_code,
      shipment_count: totalShipments,
      total_cube: totalCube,
      has_user_shipments: hasUserShipments,
      is_custom: true,
      custom_type: customType,
      origin_region_id,
      origin_region_name,
      destination_region_id,
      destination_region_name,
      combined_from: allCombinedFrom,
      shipment_details: combinedShipments,
      custom_id: customId
    } as CustomConsolidationGroup;

    console.log('✨ [CARD-CREATOR] Created custom card:', {
      customId,
      customType,
      totalShipments,
      totalCube,
      combinedFromCount: allCombinedFrom.length,
      originRegionId: origin_region_id,
      destinationRegionId: destination_region_id
    });

    return result;
  }, [getPortRegion]);

  return { createCustomCard };
};
