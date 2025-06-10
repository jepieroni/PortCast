
import { useState, useEffect } from 'react';
import { ExtendedConsolidationGroup } from './dragDropTypes';
import { ConsolidationGroup } from './types';
import { CustomConsolidationGroup } from '../useCustomConsolidations';
import { getCardKey } from './cardKeyUtils';
import { debugLogger } from '@/services/debugLogger';

export const useConsolidationState = (
  initialConsolidations: ConsolidationGroup[],
  customConsolidations: CustomConsolidationGroup[],
  isLoadingCustom: boolean
) => {
  const [consolidations, setConsolidations] = useState<ExtendedConsolidationGroup[]>([]);

  // Combine initial consolidations with custom ones, removing originals that were combined
  useEffect(() => {
    debugLogger.debug('CONSOLIDATION-STATE', 'useEffect triggered', 'consolidations-effect', {
      initialConsolidationsCount: initialConsolidations?.length || 0,
      customConsolidationsCount: customConsolidations?.length || 0,
      isLoadingCustom,
      currentConsolidationsCount: consolidations.length
    });

    // Don't update if we're still loading custom consolidations
    if (isLoadingCustom) {
      debugLogger.debug('CONSOLIDATION-STATE', 'Skipping update - still loading custom consolidations', 'consolidations-effect');
      return;
    }

    // Don't update if we don't have initial consolidations yet
    if (!initialConsolidations || initialConsolidations.length === 0) {
      debugLogger.debug('CONSOLIDATION-STATE', 'Skipping update - no initial consolidations', 'consolidations-effect');
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
        
        const newKey = getCardKey(newConsolidation);
        const existingKey = getCardKey(existing);
        return newKey !== existingKey;
      });

    if (hasChanged) {
      debugLogger.info('CONSOLIDATION-STATE', 'Updating consolidations state', 'consolidations-effect', {
        originalKept: originalConsolidationsToKeep.length,
        customAdded: customConsolidations.length,
        totalConsolidations: newConsolidations.length,
        previousCount: consolidations.length
      });
      
      setConsolidations(newConsolidations);
    } else {
      debugLogger.debug('CONSOLIDATION-STATE', 'No changes detected, keeping current state', 'consolidations-effect');
    }
  }, [initialConsolidations, customConsolidations, isLoadingCustom, consolidations.length]);

  return {
    consolidations,
    setConsolidations
  };
};
