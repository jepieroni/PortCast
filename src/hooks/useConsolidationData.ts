
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

  console.log('📊 Query Parameters:', { type, outlookDays: maxOutlookDays });

  return useQuery({
    queryKey: ['consolidation-data', type, maxOutlookDays, user?.id],
    queryFn: async () => {
      console.log('🔍 Starting consolidation data fetch...');
      
      if (!user?.id) {
        console.warn('⚠️ No user ID available for consolidation data query');
        return [];
      }

      try {
        // Fetch shipments from database
        const shipments = await fetchConsolidationShipments(type, maxOutlookDays);
        console.log('📦 Raw shipments fetched:', shipments?.length || 0);

        if (!shipments || shipments.length === 0) {
          console.log('📭 No shipments found for consolidation');
          return [];
        }

        // Process shipments into consolidation groups
        const consolidations = processStrictGrouping(shipments, user.id);
        console.log('✅ Consolidations processed:', consolidations?.length || 0);

        return consolidations;
      } catch (error) {
        console.error('❌ Error in consolidation data query:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
};
