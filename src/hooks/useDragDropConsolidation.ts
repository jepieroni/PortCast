
import { useState, useCallback, useEffect } from 'react';
import { ConsolidationGroup } from './consolidation/types';
import { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';
import { usePortRegions } from './usePortRegions';
import { useCustomConsolidations, CustomConsolidationGroup } from './useCustomConsolidations';
import { useConsolidationUtils } from './consolidation/consolidationUtils';
import { useCustomConsolidationCreator } from './consolidation/customConsolidationCreator';

export { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';

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

    console.log('🔄 Combining consolidations:', {
      initial: initialConsolidations.length,
      custom: customConsolidations.length
    });

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

  const handleDrop = useCallback((targetCard: ExtendedConsolidationGroup) => {
    if (!draggedCard || !canDrop(draggedCard, targetCard)) return;

    console.log('🎯 Handling drop consolidation');

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
    if (cards.length < 2) {
      console.warn('⚠️ Cannot consolidate less than 2 cards');
      return;
    }

    console.log('🎯 Creating multiple consolidation from', cards.length, 'cards');

    const customCard = createCustomCard(cards);
    
    // Save to database
    console.log('💾 Saving custom consolidation to database...');
    createCustomConsolidation(customCard);
    
    // Update local state immediately for better UX
    const newConsolidations = consolidations
      .filter(card => !cards.includes(card))
      .concat(customCard);
    
    console.log('🔄 Updating local consolidations state');
    setConsolidations(newConsolidations);
  }, [createCustomCard, consolidations, createCustomConsolidation]);

  const resetToOriginal = useCallback(() => {
    console.log('🔄 Resetting to original consolidations');
    
    // Delete all custom consolidations from database
    customConsolidations.forEach(custom => {
      if (custom.db_id) {
        console.log('🗑️ Deleting custom consolidation:', custom.db_id);
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
