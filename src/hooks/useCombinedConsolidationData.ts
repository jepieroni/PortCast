
import { useMemo } from 'react';
import { useCustomConsolidationData } from './useCustomConsolidationData';
import { useRegularConsolidationData } from './useRegularConsolidationData';
import { ExtendedConsolidationGroup } from './useDragDropConsolidation';

let combineRenderCount = 0;

export const useCombinedConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[]
) => {
  combineRenderCount++;
  console.log(`🔄 useCombinedConsolidationData render #${combineRenderCount}`, { type, outlookDays });

  // Fetch custom consolidations
  const customConsolidationQuery = useCustomConsolidationData(type);
  
  // Fetch regular consolidations (excluding those in custom consolidations)
  const regularConsolidationQuery = useRegularConsolidationData(type, outlookDays);

  console.log(`🔄 useCombinedConsolidationData queries state:`, {
    customLoading: customConsolidationQuery.isLoading,
    regularLoading: regularConsolidationQuery.isLoading,
    customDataLength: customConsolidationQuery.data?.length || 0,
    regularDataLength: regularConsolidationQuery.data?.length || 0
  });

  // Combine the data
  const combinedData = useMemo(() => {
    console.log(`🔄 useCombinedConsolidationData combinedData memo recalculating #${combineRenderCount}`);
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

  console.log(`🔄 useCombinedConsolidationData render #${combineRenderCount} returning:`, {
    dataLength: combinedData.length,
    isLoading,
    hasError: !!error
  });

  return {
    data: combinedData,
    isLoading,
    error
  };
};
