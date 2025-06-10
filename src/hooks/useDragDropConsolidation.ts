
import { useCallback } from 'react';
import { ConsolidationGroup } from './consolidation/types';
import { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';
import { usePortRegions } from './usePortRegions';
import { useCustomConsolidations, CustomConsolidationGroup } from './useCustomConsolidations';
import { useConsolidationUtils } from './consolidation/consolidationUtils';
import { useCustomConsolidationCreator } from './consolidation/customConsolidationCreator';
import { useConsolidationState } from './consolidation/useConsolidationState';
import { useDragDropOperations } from './consolidation/useDragDropOperations';
import { debugLogger } from '@/services/debugLogger';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export type { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';

export const useDragDropConsolidation = (
  initialConsolidations: ConsolidationGroup[],
  type: 'inbound' | 'outbound' | 'intertheater'
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { portRegions, portRegionMemberships } = usePortRegions();
  const {
    customConsolidations,
    createCustomConsolidation,
    deleteCustomConsolidation,
    isLoading: isLoadingCustom,
    isCreating: isCreatingCustom
  } = useCustomConsolidations(type);
  
  const { consolidations, setConsolidations } = useConsolidationState(
    initialConsolidations || [],
    customConsolidations,
    isLoadingCustom
  );

  const { getPortRegion, canDrop, getValidDropTargets } = useConsolidationUtils(portRegions, portRegionMemberships);
  const { createCustomCard } = useCustomConsolidationCreator(getPortRegion);

  // Function to invalidate consolidation data cache for both custom and regular consolidations
  const invalidateConsolidationData = useCallback(() => {
    debugLogger.info('DRAG-DROP-HOOK', 'Invalidating all consolidation data caches', 'invalidateConsolidationData');
    
    // Invalidate the main combined data
    queryClient.invalidateQueries({ 
      queryKey: ['consolidation-data', type] 
    });
    
    // Invalidate custom consolidations specifically
    queryClient.invalidateQueries({ 
      queryKey: ['custom-consolidations', type, user?.id] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['custom-consolidation-data', type, user?.id] 
    });
    
    // Invalidate regular consolidations specifically
    queryClient.invalidateQueries({ 
      queryKey: ['regular-consolidation-data', type] 
    });
    
    debugLogger.info('DRAG-DROP-HOOK', 'All consolidation data caches invalidated', 'invalidateConsolidationData');
  }, [queryClient, type, user?.id]);

  const {
    draggedCard,
    setDraggedCard,
    handleDrop,
    createMultipleConsolidation,
    isCreatingConsolidation
  } = useDragDropOperations(
    consolidations,
    setConsolidations,
    canDrop,
    createCustomCard,
    createCustomConsolidation,
    invalidateConsolidationData
  );

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
    
    // Invalidate cache to refresh from database
    invalidateConsolidationData();
    
    debugLogger.info('DRAG-DROP-HOOK', 'Manual reset to original consolidations completed', 'resetToOriginal');
  }, [customConsolidations, deleteCustomConsolidation, invalidateConsolidationData]);

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
    createMultipleConsolidation,
    isCreatingConsolidation: isCreatingConsolidation || isCreatingCustom
  };
};
