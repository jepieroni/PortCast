
import { useState, useCallback, useEffect } from 'react';
import { ConsolidationGroup } from './consolidation/types';
import { usePortRegions } from './usePortRegions';
import { useCustomConsolidations, CustomConsolidationGroup } from './useCustomConsolidations';

export type ExtendedConsolidationGroup = ConsolidationGroup | CustomConsolidationGroup;

export const useDragDropConsolidation = (
  initialConsolidations: ConsolidationGroup[],
  type: 'inbound' | 'outbound' | 'intertheater'
) => {
  const { portRegions, portRegionMemberships } = usePortRegions();
  const {
    customConsolidations,
    createCustomConsolidation,
    deleteCustomConsolidation,
    isLoading: isLoadingCustom
  } = useCustomConsolidations(type);
  
  const [consolidations, setConsolidations] = useState<ExtendedConsolidationGroup[]>([]);
  const [draggedCard, setDraggedCard] = useState<ExtendedConsolidationGroup | null>(null);

  // Combine initial consolidations with custom ones, removing originals that were combined
  useEffect(() => {
    if (!initialConsolidations || isLoadingCustom) return;

    // Filter out original consolidations that were used to create custom consolidations
    const originalConsolidationsToKeep = initialConsolidations.filter(original => {
      return !customConsolidations.some(custom => 
        custom.combined_from?.some(combined => 
          combined.poe_id === original.poe_id && combined.pod_id === original.pod_id
        )
      );
    });

    const allConsolidations = [...originalConsolidationsToKeep, ...customConsolidations];
    setConsolidations(allConsolidations);
    
    console.log(`📊 Combined consolidations: ${originalConsolidationsToKeep.length} original + ${customConsolidations.length} custom`);
  }, [initialConsolidations, customConsolidations, isLoadingCustom]);

  const getPortRegion = useCallback((portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    if (membership) {
      const region = portRegions.find(r => r.id === membership.region_id);
      return { id: membership.region_id, name: region?.name || 'Unknown Region' };
    }
    return null;
  }, [portRegions, portRegionMemberships]);

  const canDrop = useCallback((source: ExtendedConsolidationGroup, target: ExtendedConsolidationGroup) => {
    if (source.poe_id === target.poe_id && source.pod_id === target.pod_id) return false;

    const sourceOriginRegion = getPortRegion(source.poe_id);
    const sourceDestRegion = getPortRegion(source.pod_id);
    const targetOriginRegion = getPortRegion(target.poe_id);
    const targetDestRegion = getPortRegion(target.pod_id);

    const originRegionsMatch = sourceOriginRegion?.id === targetOriginRegion?.id;
    const destRegionsMatch = sourceDestRegion?.id === targetDestRegion?.id;

    return originRegionsMatch && destRegionsMatch;
  }, [getPortRegion]);

  const createCustomCard = useCallback((cards: ExtendedConsolidationGroup[]): CustomConsolidationGroup => {
    if (cards.length < 2) {
      throw new Error('At least 2 cards required for consolidation');
    }

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

  const handleDrop = useCallback((targetCard: ExtendedConsolidationGroup) => {
    if (!draggedCard || !canDrop(draggedCard, targetCard)) return;

    const customCard = createCustomCard([draggedCard, targetCard]);
    
    // Save to database
    createCustomConsolidation(customCard);
    
    // Update local state immediately for better UX
    const newConsolidations = consolidations
      .filter(card => card !== draggedCard && card !== targetCard)
      .concat(customCard);
    
    setConsolidations(newConsolidations);
    setDraggedCard(null);
  }, [draggedCard, canDrop, createCustomCard, consolidations, createCustomConsolidation]);

  const createMultipleConsolidation = useCallback((cards: ExtendedConsolidationGroup[]) => {
    if (cards.length < 2) return;

    const customCard = createCustomCard(cards);
    
    // Save to database
    createCustomConsolidation(customCard);
    
    // Update local state immediately for better UX
    const newConsolidations = consolidations
      .filter(card => !cards.includes(card))
      .concat(customCard);
    
    setConsolidations(newConsolidations);
  }, [createCustomCard, consolidations, createCustomConsolidation]);

  const resetToOriginal = useCallback(() => {
    // Delete all custom consolidations from database
    customConsolidations.forEach(custom => {
      if (custom.db_id) {
        deleteCustomConsolidation(custom.db_id);
      }
    });
    
    // Reset local state to original consolidations
    setConsolidations(initialConsolidations);
  }, [customConsolidations, deleteCustomConsolidation, initialConsolidations]);

  const getValidDropTargets = useCallback((source: ExtendedConsolidationGroup) => {
    return consolidations.filter(card => card !== source && canDrop(source, card));
  }, [consolidations, canDrop]);

  return {
    consolidations,
    draggedCard,
    setDraggedCard,
    handleDrop,
    canDrop,
    resetToOriginal,
    getValidDropTargets,
    isLoading: isLoadingCustom,
    createMultipleConsolidation
  };
};
