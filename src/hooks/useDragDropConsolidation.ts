
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

  const createCustomCard = useCallback((source: ExtendedConsolidationGroup, target: ExtendedConsolidationGroup): CustomConsolidationGroup => {
    const sourceOriginRegion = getPortRegion(source.poe_id);
    const sourceDestRegion = getPortRegion(source.pod_id);
    const targetOriginRegion = getPortRegion(target.poe_id);
    const targetDestRegion = getPortRegion(target.pod_id);

    const originRegionsMatch = sourceOriginRegion?.id === targetOriginRegion?.id;
    const destRegionsMatch = sourceDestRegion?.id === targetDestRegion?.id;

    let customType: CustomConsolidationGroup['custom_type'];
    let poe_name: string, poe_code: string, pod_name: string, pod_code: string;
    let origin_region_id: string | undefined, origin_region_name: string | undefined;
    let destination_region_id: string | undefined, destination_region_name: string | undefined;

    if (originRegionsMatch && destRegionsMatch) {
      customType = 'region_to_region';
      poe_name = `Region: ${sourceOriginRegion!.name}`;
      poe_code = '';
      pod_name = `Region: ${sourceDestRegion!.name}`;
      pod_code = '';
      origin_region_id = sourceOriginRegion!.id;
      origin_region_name = sourceOriginRegion!.name;
      destination_region_id = sourceDestRegion!.id;
      destination_region_name = sourceDestRegion!.name;
    } else if (originRegionsMatch) {
      customType = 'region_to_port';
      poe_name = `Region: ${sourceOriginRegion!.name}`;
      poe_code = '';
      pod_name = source.pod_name === target.pod_name ? source.pod_name : `Region: ${sourceDestRegion!.name}`;
      pod_code = source.pod_code === target.pod_code ? source.pod_code : '';
      origin_region_id = sourceOriginRegion!.id;
      origin_region_name = sourceOriginRegion!.name;
      if (source.pod_name !== target.pod_name) {
        destination_region_id = sourceDestRegion!.id;
        destination_region_name = sourceDestRegion!.name;
      }
    } else if (destRegionsMatch) {
      customType = 'port_to_region';
      poe_name = source.poe_name === target.poe_name ? source.poe_name : `Region: ${sourceOriginRegion!.name}`;
      poe_code = source.poe_code === target.poe_code ? source.poe_code : '';
      pod_name = `Region: ${sourceDestRegion!.name}`;
      pod_code = '';
      if (source.poe_name !== target.poe_name) {
        origin_region_id = sourceOriginRegion!.id;
        origin_region_name = sourceOriginRegion!.name;
      }
      destination_region_id = sourceDestRegion!.id;
      destination_region_name = sourceDestRegion!.name;
    } else {
      customType = 'port_to_port';
      poe_name = source.poe_name;
      poe_code = source.poe_code;
      pod_name = target.pod_name;
      pod_code = target.pod_code;
    }

    // Collect all shipment details from both source and target
    const getShipmentDetails = (consolidation: ExtendedConsolidationGroup): any[] => {
      if ('is_custom' in consolidation) {
        return consolidation.shipment_details || [];
      }
      return [];
    };

    const combinedShipments = [
      ...getShipmentDetails(source),
      ...getShipmentDetails(target)
    ];

    const customId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      poe_id: source.poe_id,
      poe_name,
      poe_code,
      pod_id: target.pod_id,
      pod_name,
      pod_code,
      shipment_count: source.shipment_count + target.shipment_count,
      total_cube: source.total_cube + target.total_cube,
      has_user_shipments: source.has_user_shipments || target.has_user_shipments,
      is_custom: true,
      custom_type: customType,
      origin_region_id,
      origin_region_name,
      destination_region_id,
      destination_region_name,
      combined_from: [
        ...(('is_custom' in source) ? source.combined_from : [source]),
        ...(('is_custom' in target) ? target.combined_from : [target])
      ],
      shipment_details: combinedShipments,
      custom_id: customId
    };
  }, [getPortRegion]);

  const handleDrop = useCallback((targetCard: ExtendedConsolidationGroup) => {
    if (!draggedCard || !canDrop(draggedCard, targetCard)) return;

    const customCard = createCustomCard(draggedCard, targetCard);
    
    // Save to database
    createCustomConsolidation(customCard);
    
    // Update local state immediately for better UX
    const newConsolidations = consolidations
      .filter(card => card !== draggedCard && card !== targetCard)
      .concat(customCard);
    
    setConsolidations(newConsolidations);
    setDraggedCard(null);
  }, [draggedCard, canDrop, createCustomCard, consolidations, createCustomConsolidation]);

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
    isLoading: isLoadingCustom
  };
};
