
import { useCallback } from 'react';
import { ConsolidationGroup } from './consolidation/types';
import { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';
import { usePortRegions } from './usePortRegions';
import { useCustomConsolidations, CustomConsolidationGroup } from './useCustomConsolidations';
import { useConsolidationUtils } from './consolidation/consolidationUtils';
import { useCustomConsolidationCreator } from './consolidation/customConsolidationCreator';
import { useDragDropOperations } from './consolidation/useDragDropOperations';
import { debugLogger } from '@/services/debugLogger';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export type { ExtendedConsolidationGroup } from './consolidation/dragDropTypes';

let renderCount = 0;

export const useDragDropConsolidation = (
  consolidations: ExtendedConsolidationGroup[],
  type: 'inbound' | 'outbound' | 'intertheater'
) => {
  renderCount++;
  console.log(`🔄 useDragDropConsolidation render #${renderCount}`, {
    type,
    consolidationsCount: consolidations.length,
    consolidationsHash: JSON.stringify(consolidations.map(c => ({ 
      id: 'is_custom' in c ? c.custom_id || c.poe_id + c.pod_id : c.poe_id + c.pod_id,
      isCustom: 'is_custom' in c ? c.is_custom : false 
    }))).substring(0, 100)
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { portRegions, portRegionMemberships } = usePortRegions();
  const {
    createCustomConsolidation,
    deleteCustomConsolidation,
    isCreating: isCreatingCustom
  } = useCustomConsolidations(type);

  const { getPortRegion, canDrop, getValidDropTargets } = useConsolidationUtils(portRegions, portRegionMemberships);
  const { createCustomCard } = useCustomConsolidationCreator(getPortRegion);

  // Function to invalidate consolidation data cache for both custom and regular consolidations
  const invalidateConsolidationData = useCallback(() => {
    console.log('🔄 invalidateConsolidationData called');
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
    canDrop,
    createCustomCard,
    createCustomConsolidation,
    invalidateConsolidationData
  );

  const resetToOriginal = useCallback(() => {
    console.log('🔄 resetToOriginal called');
    debugLogger.info('DRAG-DROP-HOOK', 'Manual reset to original consolidations triggered', 'resetToOriginal');
    
    // Get custom consolidations and delete them
    const customConsolidations = consolidations.filter(c => 'is_custom' in c && c.is_custom) as CustomConsolidationGroup[];
    
    customConsolidations.forEach(custom => {
      if (custom.db_id) {
        deleteCustomConsolidation(custom.db_id);
      }
    });
    
    // Invalidate cache to refresh from database
    invalidateConsolidationData();
    
    debugLogger.info('DRAG-DROP-HOOK', 'Manual reset to original consolidations completed', 'resetToOriginal');
  }, [consolidations, deleteCustomConsolidation, invalidateConsolidationData]);

  const getValidDropTargetsForCard = useCallback((source: ExtendedConsolidationGroup) => {
    console.log('🔄 getValidDropTargetsForCard called for:', 'is_custom' in source ? source.custom_id : source.poe_id + source.pod_id);
    return getValidDropTargets(source, consolidations);
  }, [consolidations, getValidDropTargets]);

  console.log(`🔄 useDragDropConsolidation returning from render #${renderCount}`);

  return {
    consolidations,
    draggedCard,
    setDraggedCard,
    handleDrop,
    canDrop,
    resetToOriginal,
    getValidDropTargets: getValidDropTargetsForCard,
    isLoading: false,
    createMultipleConsolidation,
    isCreatingConsolidation: isCreatingConsolidation || isCreatingCustom
  };
};
