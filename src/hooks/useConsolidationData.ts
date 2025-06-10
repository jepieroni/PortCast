
import { useQuery } from '@tanstack/react-query';
import { fetchConsolidationShipments } from './consolidation/consolidationService';
import { processStrictGrouping } from './consolidation/strictGrouping';
import { useAuth } from './useAuth';

export const useConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[]
) => {
  const { user } = useAuth();
  const maxOutlookDays = Math.max(...outlookDays);

  return useQuery({
    queryKey: ['consolidation-data', type, maxOutlookDays, user?.id],
    queryFn: async () => {
      console.log('🔍 Starting consolidation data fetch...', { type, outlookDays: maxOutlookDays });
      
      if (!user?.id) {
        console.warn('⚠️ No user ID available for consolidation data query');
        return [];
      }

      try {
        // Fetch shipments from database with timeout
        console.log('📦 Fetching shipments...');
        const shipments = await Promise.race([
          fetchConsolidationShipments(type, maxOutlookDays),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000)
          )
        ]);
        
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
    staleTime: 1000 * 60 * 1, // Reduced to 1 minute for faster updates
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.log('🔄 Query retry attempt:', failureCount, error);
      return failureCount < 2; // Only retry twice
    }
  });
};
