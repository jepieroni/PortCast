
import { useMemo } from 'react';
import { useCustomConsolidationData } from './useCustomConsolidationData';
import { useRegularConsolidationData } from './useRegularConsolidationData';
import { ExtendedConsolidationGroup } from './useDragDropConsolidation';

export const useCombinedConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[]
) => {
  // Fetch custom consolidations
  const customConsolidationQuery = useCustomConsolidationData(type);
  
  // Fetch regular consolidations (excluding those in custom consolidations)
  const regularConsolidationQuery = useRegularConsolidationData(type, outlookDays);

  // Combine the data
  const combinedData = useMemo(() => {
    const customConsolidations = customConsolidationQuery.data || [];
    const regularConsolidations = regularConsolidationQuery.data || [];
    
    // Cast custom consolidations to ExtendedConsolidationGroup format
    const extendedCustom: ExtendedConsolidationGroup[] = customConsolidations.map(custom => ({
      ...custom,
      is_custom: true as const
    }));
    
    // Cast regular consolidations to ExtendedConsolidationGroup format
    const extendedRegular: ExtendedConsolidationGroup[] = regularConsolidations.map(regular => ({
      ...regular,
      is_custom: false as const
    }));

    console.log('🔄 Combining consolidation data:', {
      customCount: extendedCustom.length,
      regularCount: extendedRegular.length,
      totalCount: extendedCustom.length + extendedRegular.length
    });

    return [...extendedCustom, ...extendedRegular];
  }, [customConsolidationQuery.data, regularConsolidationQuery.data]);

  const isLoading = customConsolidationQuery.isLoading || regularConsolidationQuery.isLoading;
  const error = customConsolidationQuery.error || regularConsolidationQuery.error;

  return {
    data: combinedData,
    isLoading,
    error
  };
};
