
import { useCombinedConsolidationData } from './useCombinedConsolidationData';

export const useConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[]
) => {
  console.log('🎯 useConsolidationData called with:', { 
    type, 
    outlookDays
  });

  return useCombinedConsolidationData(type, outlookDays);
};
