
import { useQuery } from '@tanstack/react-query';
import { fetchConsolidationShipments } from './consolidation/consolidationService';
import { processStrictGrouping } from './consolidation/strictGrouping';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

export const useConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[]
) => {
  const { user } = useAuth();
  
  // Memoize the max outlook days to prevent infinite re-renders
  const maxOutlookDays = useMemo(() => Math.max(...outlookDays), [outlookDays]);
  
  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => 
    ['consolidation-data', type, maxOutlookDays, user?.id], 
    [type, maxOutlookDays, user?.id]
  );

  console.log('🎯 useConsolidationData called with:', { 
    type, 
    maxOutlookDays, 
    userId: user?.id,
    enabled: !!user?.id 
  });

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 Starting consolidation data fetch...', { type, outlookDays: maxOutlookDays });
      
      if (!user?.id) {
        console.warn('⚠️ No user ID available for consolidation data query');
        return [];
      }

      try {
        // Fetch shipments from database
        console.log('📦 Fetching shipments...');
        const shipments = await fetchConsolidationShipments(type, maxOutlookDays);
        
        console.log('📦 Raw shipments fetched:', Array.isArray(shipments) ? shipments.length : 0);

        if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
          console.log('📭 No shipments found for consolidation');
          return [];
        }

        // Process shipments into consolidation groups
        console.log('⚙️ Processing consolidations...');
        const consolidations = processStrictGrouping(shipments, user.id);
        console.log('✅ Consolidations processed:', Array.isArray(consolidations) ? consolidations.length : 0);

        return consolidations;
      } catch (error) {
        console.error('❌ Error in consolidation data query:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1
  });
};
