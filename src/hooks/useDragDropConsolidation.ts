
import { useState, useCallback, useEffect } from 'react';
import { ConsolidationGroup } from './consolidation/types';
import { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';
import { usePortRegions } from './usePortRegions';
import { useCustomConsolidations, CustomConsolidationGroup } from './useCustomConsolidations';
import { useConsolidationUtils } from './consolidation/consolidationUtils';
import { useCustomConsolidationCreator } from './consolidation/customConsolidationCreator';
import { debugLogger } from '@/services/debugLogger';

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
  // Only update when there are actual changes to prevent losing custom consolidations
  useEffect(() => {
    debugLogger.debug('DRAG-DROP-HOOK', 'useEffect triggered', 'consolidations-effect', {
      initialConsolidationsCount: initialConsolidations?.length || 0,
      customConsolidationsCount: customConsolidations?.length || 0,
      isLoadingCustom,
      currentConsolidationsCount: consolidations.length
    });

    // Don't update if we're still loading custom consolidations
    if (isLoadingCustom) {
      debugLogger.debug('DRAG-DROP-HOOK', 'Skipping update - still loading custom consolidations', 'consolidations-effect');
      return;
    }

    // Don't update if we don't have initial consolidations yet
    if (!initialConsolidations || initialConsolidations.length === 0) {
      debugLogger.debug('DRAG-DROP-HOOK', 'Skipping update - no initial consolidations', 'consolidations-effect');
      return;
    }

    // Filter out original consolidations that were used to create custom consolidations
    const originalConsolidationsToKeep = initialConsolidations.filter(original => {
      return !customConsolidations.some(custom => 
        custom.combined_from?.some(combined => 
          combined.poe_id === original.poe_id && combined.pod_id === original.pod_id
        )
      );
    });

    const newConsolidations = [...originalConsolidationsToKeep, ...customConsolidations];
    
    // Only update if the consolidations have actually changed
    const hasChanged = newConsolidations.length !== consolidations.length ||
      newConsolidations.some((newConsolidation, index) => {
        const existing = consolidations[index];
        if (!existing) return true;
        
        // Compare by key
        const newKey = 'is_custom' in newConsolidation ? newConsolidation.custom_id : `${newConsolidation.poe_id}-${newConsolidation.pod_id}`;
        const existingKey = 'is_custom' in existing ? existing.custom_id : `${existing.poe_id}-${existing.pod_id}`;
        return newKey !== existingKey;
      });

    if (hasChanged) {
      debugLogger.info('DRAG-DROP-HOOK', 'Updating consolidations state', 'consolidations-effect', {
        originalKept: originalConsolidationsToKeep.length,
        customAdded: customConsolidations.length,
        totalConsolidations: newConsolidations.length,
        previousCount: consolidations.length
      });
      
      setConsolidations(newConsolidations);
    } else {
      debugLogger.debug('DRAG-DROP-HOOK', 'No changes detected, keeping current state', 'consolidations-effect');
    }
  }, [initialConsolidations, customConsolidations, isLoadingCustom]);

  const handleDrop = useCallback((targetCard: ExtendedConsolidationGroup) => {
    debugLogger.info('DRAG-DROP-HOOK', 'Drop operation initiated', 'handleDrop', {
      draggedCard: draggedCard ? 'is_custom' in draggedCard ? draggedCard.custom_id : `${draggedCard.poe_id}-${draggedCard.pod_id}` : null,
      targetCard: 'is_custom' in targetCard ? targetCard.custom_id : `${targetCard.poe_id}-${targetCard.pod_id}`
    });

    if (!draggedCard || !canDrop(draggedCard, targetCard)) {
      debugLogger.warn('DRAG-DROP-HOOK', 'Drop operation cancelled - invalid conditions', 'handleDrop');
      return;
    }

    const customCard = createCustomCard([draggedCard, targetCard]);
    debugLogger.debug('DRAG-DROP-HOOK', 'Custom card created for drop operation', 'handleDrop', { customCard: customCard.custom_id });
    
    // Save to database
    createCustomConsolidation(customCard);
    
    // Update local state immediately for better UX
    const newConsolidations = consolidations
      .filter(card => card !== draggedCard && card !== targetCard)
      .concat(customCard);
    
    debugLogger.info('DRAG-DROP-HOOK', 'Local state updated after drop', 'handleDrop', {
      previousCount: consolidations.length,
      newCount: newConsolidations.length
    });
    
    setConsolidations(newConsolidations);
    setDraggedCard(null);
  }, [draggedCard, canDrop, createCustomCard, consolidations, createCustomConsolidation]);

  const createMultipleConsolidation = useCallback((cards: ExtendedConsolidationGroup[]) => {
    debugLogger.info('DRAG-DROP-HOOK', 'createMultipleConsolidation called', 'createMultipleConsolidation', { cardsCount: cards.length });
    
    if (cards.length < 2) {
      debugLogger.warn('DRAG-DROP-HOOK', 'Cannot consolidate less than 2 cards', 'createMultipleConsolidation');
      return;
    }

    debugLogger.debug('DRAG-DROP-HOOK', 'Card details for multiple consolidation', 'createMultipleConsolidation', {
      cards: cards.map(c => ({
        key: 'is_custom' in c ? c.custom_id : `${c.poe_id}-${c.pod_id}`,
        poe: c.poe_name,
        pod: c.pod_name,
        shipments: c.shipment_count,
        isCustom: 'is_custom' in c
      }))
    });

    try {
      debugLogger.debug('DRAG-DROP-HOOK', 'Creating custom card...', 'createMultipleConsolidation');
      const customCard = createCustomCard(cards);
      debugLogger.info('DRAG-DROP-HOOK', 'Custom card created successfully', 'createMultipleConsolidation', {
        customId: customCard.custom_id,
        poe: customCard.poe_name,
        pod: customCard.pod_name,
        totalShipments: customCard.shipment_count,
        customType: customCard.custom_type
      });
      
      debugLogger.debug('DRAG-DROP-HOOK', 'Calling createCustomConsolidation...', 'createMultipleConsolidation');
      createCustomConsolidation(customCard);
      debugLogger.info('DRAG-DROP-HOOK', 'createCustomConsolidation called successfully', 'createMultipleConsolidation');
      
      // Update local state immediately for better UX
      const newConsolidations = consolidations
        .filter(card => !cards.includes(card))
        .concat(customCard);
      
      debugLogger.info('DRAG-DROP-HOOK', 'Updating local consolidations state', 'createMultipleConsolidation', {
        previousCount: consolidations.length,
        newCount: newConsolidations.length
      });
      setConsolidations(newConsolidations);
    } catch (error) {
      debugLogger.error('DRAG-DROP-HOOK', 'Error in createMultipleConsolidation', 'createMultipleConsolidation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  }, [createCustomCard, consolidations, createCustomConsolidation]);

  const resetToOriginal = useCallback(() => {
    debugLogger.info('DRAG-DROP-HOOK', 'Manual reset to original consolidations triggered', 'resetToOriginal', {
      customConsolidationsToDelete: customConsolidations.length
    });
    
    // Delete all custom consolidations from database
    customConsolidations.forEach(custom => {
      if (custom.db_id) {
        deleteCustomConsolidation(custom.db_id);
      }
    });
    
    // Reset local state to original consolidations only
    setConsolidations(initialConsolidations);
    debugLogger.info('DRAG-DROP-HOOK', 'Manual reset to original consolidations completed', 'resetToOriginal');
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
