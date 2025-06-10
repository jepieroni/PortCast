
import { useState, useCallback } from 'react';
import { ExtendedConsolidationGroup } from './dragDropTypes';
import { CustomConsolidationGroup } from '../useCustomConsolidations';
import { getCardKey } from './cardKeyUtils';
import { debugLogger } from '@/services/debugLogger';

export const useDragDropOperations = (
  consolidations: ExtendedConsolidationGroup[],
  setConsolidations: (consolidations: ExtendedConsolidationGroup[]) => void,
  canDrop: (source: ExtendedConsolidationGroup, target: ExtendedConsolidationGroup) => boolean,
  createCustomCard: (cards: ExtendedConsolidationGroup[]) => CustomConsolidationGroup,
  createCustomConsolidation: (customCard: CustomConsolidationGroup) => void
) => {
  const [draggedCard, setDraggedCard] = useState<ExtendedConsolidationGroup | null>(null);

  const handleDrop = useCallback((targetCard: ExtendedConsolidationGroup) => {
    const getDraggedCardKey = () => {
      if (!draggedCard) return null;
      return getCardKey(draggedCard);
    };

    const getTargetCardKey = () => {
      return getCardKey(targetCard);
    };

    debugLogger.info('DRAG-DROP-OPERATIONS', 'Drop operation initiated', 'handleDrop', {
      draggedCard: getDraggedCardKey(),
      targetCard: getTargetCardKey()
    });

    if (!draggedCard || !canDrop(draggedCard, targetCard)) {
      debugLogger.warn('DRAG-DROP-OPERATIONS', 'Drop operation cancelled - invalid conditions', 'handleDrop');
      return;
    }

    const customCard = createCustomCard([draggedCard, targetCard]);
    debugLogger.debug('DRAG-DROP-OPERATIONS', 'Custom card created for drop operation', 'handleDrop', { customCard: customCard.custom_id });
    
    // Save to database
    createCustomConsolidation(customCard);
    
    // Update local state immediately for better UX
    const newConsolidations = consolidations
      .filter(card => card !== draggedCard && card !== targetCard)
      .concat(customCard);
    
    debugLogger.info('DRAG-DROP-OPERATIONS', 'Local state updated after drop', 'handleDrop', {
      previousCount: consolidations.length,
      newCount: newConsolidations.length
    });
    
    setConsolidations(newConsolidations);
    setDraggedCard(null);
  }, [draggedCard, canDrop, createCustomCard, consolidations, createCustomConsolidation, setConsolidations]);

  const createMultipleConsolidation = useCallback((cards: ExtendedConsolidationGroup[]) => {
    debugLogger.info('DRAG-DROP-OPERATIONS', 'createMultipleConsolidation called', 'createMultipleConsolidation', { cardsCount: cards.length });
    
    if (cards.length < 2) {
      debugLogger.warn('DRAG-DROP-OPERATIONS', 'Cannot consolidate less than 2 cards', 'createMultipleConsolidation');
      return;
    }

    debugLogger.debug('DRAG-DROP-OPERATIONS', 'Card details for multiple consolidation', 'createMultipleConsolidation', {
      cards: cards.map(c => ({
        key: getCardKey(c),
        poe: c.poe_name,
        pod: c.pod_name,
        shipments: c.shipment_count,
        isCustom: 'is_custom' in c && c.is_custom
      }))
    });

    try {
      debugLogger.debug('DRAG-DROP-OPERATIONS', 'Creating custom card...', 'createMultipleConsolidation');
      const customCard = createCustomCard(cards);
      debugLogger.info('DRAG-DROP-OPERATIONS', 'Custom card created successfully', 'createMultipleConsolidation', {
        customId: customCard.custom_id,
        poe: customCard.poe_name,
        pod: customCard.pod_name,
        totalShipments: customCard.shipment_count,
        customType: customCard.custom_type
      });
      
      debugLogger.debug('DRAG-DROP-OPERATIONS', 'Calling createCustomConsolidation...', 'createMultipleConsolidation');
      createCustomConsolidation(customCard);
      debugLogger.info('DRAG-DROP-OPERATIONS', 'createCustomConsolidation called successfully', 'createMultipleConsolidation');
      
      // Update local state immediately for better UX
      const newConsolidations = consolidations
        .filter(card => !cards.includes(card))
        .concat(customCard);
      
      debugLogger.info('DRAG-DROP-OPERATIONS', 'Updating local consolidations state', 'createMultipleConsolidation', {
        previousCount: consolidations.length,
        newCount: newConsolidations.length
      });
      setConsolidations(newConsolidations);
    } catch (error) {
      debugLogger.error('DRAG-DROP-OPERATIONS', 'Error in createMultipleConsolidation', 'createMultipleConsolidation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  }, [createCustomCard, consolidations, createCustomConsolidation, setConsolidations]);

  return {
    draggedCard,
    setDraggedCard,
    handleDrop,
    createMultipleConsolidation
  };
};
