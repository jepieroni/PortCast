
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

  // Database-driven state management - only update when database data changes
  useEffect(() => {
    debugLogger.debug('CONSOLIDATION-STATE', 'Database-driven update triggered', 'consolidations-effect', {
      initialConsolidationsCount: initialConsolidations?.length || 0,
      customConsolidationsCount: customConsolidations?.length || 0,
      isLoadingCustom
    });

    // Don't update if we're still loading custom consolidations
    if (isLoadingCustom) {
      debugLogger.debug('CONSOLIDATION-STATE', 'Skipping update - still loading custom consolidations', 'consolidations-effect');
      return;
    }

    // Don't update if we don't have initial consolidations yet
    if (!initialConsolidations || initialConsolidations.length === 0) {
      debugLogger.debug('CONSOLIDATION-STATE', 'Skipping update - no initial consolidations', 'consolidations-effect');
      // If we have custom consolidations but no initial ones, still show the custom ones
      if (customConsolidations.length > 0) {
        debugLogger.info('CONSOLIDATION-STATE', 'Setting only custom consolidations (no initial consolidations)', 'consolidations-effect');
        setConsolidations(customConsolidations);
      } else {
        setConsolidations([]);
      }
      return;
    }

    // Create a Set of all POE-POD combinations that are part of custom consolidations
    const combinedRoutes = new Set<string>();
    
    customConsolidations.forEach(custom => {
      if (custom.combined_from) {
        custom.combined_from.forEach(combined => {
          const routeKey = `${combined.poe_id}-${combined.pod_id}`;
          combinedRoutes.add(routeKey);
          debugLogger.debug('CONSOLIDATION-STATE', 'Adding combined route to exclusion set', 'consolidations-effect', {
            routeKey,
            poe: combined.poe_name,
            pod: combined.pod_name
          });
        });
      }
    });

    // Filter out original consolidations that were used to create custom consolidations
    const originalConsolidationsToKeep = initialConsolidations.filter(original => {
      const routeKey = `${original.poe_id}-${original.pod_id}`;
      const shouldExclude = combinedRoutes.has(routeKey);
      
      if (shouldExclude) {
        debugLogger.debug('CONSOLIDATION-STATE', 'Excluding original consolidation (part of custom)', 'consolidations-effect', {
          routeKey,
          poe: original.poe_name,
          pod: original.pod_name
        });
      }
      
      return !shouldExclude;
    });

    const newConsolidations = [...originalConsolidationsToKeep, ...customConsolidations];
    
    debugLogger.info('CONSOLIDATION-STATE', 'Updating consolidations from database', 'consolidations-effect', {
      originalKept: originalConsolidationsToKeep.length,
      customAdded: customConsolidations.length,
      totalConsolidations: newConsolidations.length,
      combinedRoutesExcluded: combinedRoutes.size
    });
    
    setConsolidations(newConsolidations);
  }, [initialConsolidations, customConsolidations, isLoadingCustom]);

  return {
    consolidations,
    setConsolidations
  };
};
