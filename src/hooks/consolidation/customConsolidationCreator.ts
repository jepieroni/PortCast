
import { useCallback } from 'react';
import { ExtendedConsolidationGroup } from './dragDropTypes';
import { CustomConsolidationGroup } from '../useCustomConsolidations';

export const useCustomConsolidationCreator = (getPortRegion: (portId: string) => { id: string; name: string } | null) => {
  const createCustomCard = useCallback((cards: ExtendedConsolidationGroup[]): CustomConsolidationGroup => {
    if (cards.length < 2) {
      throw new Error('At least 2 cards required for consolidation');
    }

    console.log('🎯 Creating custom card from:', cards.length, 'cards');

    const firstCard = cards[0];
    const firstOriginRegion = getPortRegion(firstCard.poe_id);
    const firstDestRegion = getPortRegion(firstCard.pod_id);

    // Determine consolidation type based on regions
    let customType: CustomConsolidationGroup['custom_type'];
    let poe_name: string, poe_code: string, pod_name: string, pod_code: string;
    let origin_region_id: string | undefined, origin_region_name: string | undefined;
    let destination_region_id: string | undefined, destination_region_name: string | undefined;

    // Check if all cards have the same origin and destination regions
    const allSameOriginRegion = cards.every(card => {
      const originRegion = getPortRegion(card.poe_id);
      return originRegion?.id === firstOriginRegion?.id;
    });

    const allSameDestRegion = cards.every(card => {
      const destRegion = getPortRegion(card.pod_id);
      return destRegion?.id === firstDestRegion?.id;
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

    console.log('✨ Created custom card:', {
      type: customType,
      totalShipments,
      totalCube,
      combinedFromCount: allCombinedFrom.length
    });

    return {
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
    };
  }, [getPortRegion]);

  return { createCustomCard };
};
