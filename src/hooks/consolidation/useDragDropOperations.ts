
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
  createCustomConsolidation: (customCard: CustomConsolidationGroup) => Promise<any>,
  invalidateConsolidationData: () => void
) => {
  const [draggedCard, setDraggedCard] = useState<ExtendedConsolidationGroup | null>(null);
  const [isCreatingConsolidation, setIsCreatingConsolidation] = useState(false);

  const handleDrop = useCallback(async (targetCard: ExtendedConsolidationGroup) => {
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

    setIsCreatingConsolidation(true);

    try {
      const customCard = createCustomCard([draggedCard, targetCard]);
      debugLogger.debug('DRAG-DROP-OPERATIONS', 'Custom card created for drop operation', 'handleDrop', { customCard: customCard.custom_id });
      
      // Save to database and wait for completion
      await createCustomConsolidation(customCard);
      
      debugLogger.info('DRAG-DROP-OPERATIONS', 'Drop operation completed successfully', 'handleDrop');
      
      // Invalidate cache to refresh from database
      invalidateConsolidationData();
    } catch (error) {
      debugLogger.error('DRAG-DROP-OPERATIONS', 'Error in drop operation', 'handleDrop', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setDraggedCard(null);
      setIsCreatingConsolidation(false);
    }
  }, [draggedCard, canDrop, createCustomCard, createCustomConsolidation, invalidateConsolidationData]);

  const createMultipleConsolidation = useCallback(async (cards: ExtendedConsolidationGroup[]) => {
    debugLogger.info('DRAG-DROP-OPERATIONS', 'createMultipleConsolidation called', 'createMultipleConsolidation', { cardsCount: cards.length });
    
    if (cards.length < 2) {
      debugLogger.warn('DRAG-DROP-OPERATIONS', 'Cannot consolidate less than 2 cards', 'createMultipleConsolidation');
      return;
    }

    setIsCreatingConsolidation(true);

    try {
      const customCard = createCustomCard(cards);
      debugLogger.info('DRAG-DROP-OPERATIONS', 'Custom card created successfully', 'createMultipleConsolidation', {
        customId: customCard.custom_id,
        poe: customCard.poe_name,
        pod: customCard.pod_name,
        totalShipments: customCard.shipment_count,
        customType: customCard.custom_type
      });
      
      // Save to database and wait for completion
      await createCustomConsolidation(customCard);
      
      debugLogger.info('DRAG-DROP-OPERATIONS', 'Multiple consolidation completed successfully', 'createMultipleConsolidation');
      
      // Invalidate cache to refresh from database
      invalidateConsolidationData();
    } catch (error) {
      debugLogger.error('DRAG-DROP-OPERATIONS', 'Error in createMultipleConsolidation', 'createMultipleConsolidation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    } finally {
      setIsCreatingConsolidation(false);
    }
  }, [createCustomCard, createCustomConsolidation, invalidateConsolidationData]);

  return {
    draggedCard,
    setDraggedCard,
    handleDrop,
    createMultipleConsolidation,
    isCreatingConsolidation
  };
};
