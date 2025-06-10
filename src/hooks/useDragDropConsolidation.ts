
import { useState, useCallback, useEffect } from 'react';
import { ConsolidationGroup } from './consolidation/types';
import { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';
import { usePortRegions } from './usePortRegions';
import { useCustomConsolidations, CustomConsolidationGroup } from './useCustomConsolidations';
import { useConsolidationUtils } from './consolidation/consolidationUtils';
import { useCustomConsolidationCreator } from './consolidation/customConsolidationCreator';

export type { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';

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

  const { getPortRegion, canDrop, getValidDropTargets } = useConsolidationUtils(portRegions, portRegionMemberships);
  const { createCustomCard } = useCustomConsolidationCreator(getPortRegion);

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
  }, [initialConsolidations, customConsolidations, isLoadingCustom]);

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
    console.log('🎯 [DRAG-DROP-HOOK] createMultipleConsolidation called with', cards.length, 'cards');
    
    if (cards.length < 2) {
      console.warn('⚠️ [DRAG-DROP-HOOK] Cannot consolidate less than 2 cards');
      return;
    }

    console.log('🎯 [DRAG-DROP-HOOK] Card details:', cards.map(c => ({
      key: 'is_custom' in c ? c.custom_id : `${c.poe_id}-${c.pod_id}`,
      poe: c.poe_name,
      pod: c.pod_name,
      shipments: c.shipment_count,
      isCustom: 'is_custom' in c
    })));

    try {
      console.log('🛠️ [DRAG-DROP-HOOK] Creating custom card...');
      const customCard = createCustomCard(cards);
      console.log('✅ [DRAG-DROP-HOOK] Custom card created:', {
        customId: customCard.custom_id,
        poe: customCard.poe_name,
        pod: customCard.pod_name,
        totalShipments: customCard.shipment_count,
        customType: customCard.custom_type
      });
      
      console.log('💾 [DRAG-DROP-HOOK] Calling createCustomConsolidation...');
      createCustomConsolidation(customCard);
      console.log('✅ [DRAG-DROP-HOOK] createCustomConsolidation called successfully');
      
      // Update local state immediately for better UX
      const newConsolidations = consolidations
        .filter(card => !cards.includes(card))
        .concat(customCard);
      
      console.log('🔄 [DRAG-DROP-HOOK] Updating local consolidations state');
      console.log('📊 [DRAG-DROP-HOOK] Previous count:', consolidations.length, 'New count:', newConsolidations.length);
      setConsolidations(newConsolidations);
    } catch (error) {
      console.error('❌ [DRAG-DROP-HOOK] Error in createMultipleConsolidation:', error);
      console.error('❌ [DRAG-DROP-HOOK] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
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

  const getValidDropTargetsForCard = useCallback((source: ExtendedConsolidationGroup) => {
    return getValidDropTargets(source, consolidations);
  }, [consolidations, getValidDropTargets]);

  return {
    consolidations,
    draggedCard,
    setDraggedCard,
    handleDrop,
    canDrop,
    resetToOriginal,
    getValidDropTargets: getValidDropTargetsForCard,
    isLoading: isLoadingCustom,
    createMultipleConsolidation
  };
};
