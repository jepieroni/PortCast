
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchConsolidationShipments } from './consolidation/consolidationService';
import { processStrictGrouping } from './consolidation/strictGrouping';

// Re-export types for backward compatibility
export type { ConsolidationGroup, FlexibilitySettings } from './consolidation/types';

export const useConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[],
  flexibilitySettings?: import('./consolidation/types').FlexibilitySettings
) => {
  return useQuery({
    queryKey: ['consolidation-data', type, outlookDays[0]],
    queryFn: async () => {
      console.log('📊 Query Parameters:', {
        type,
        outlookDays: outlookDays[0]
      });

      const shipments = await fetchConsolidationShipments(type, outlookDays[0]);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Always use strict grouping for now until new flexible strategy is implemented
      console.log('🔒 Using STRICT grouping');
      return processStrictGrouping(shipments, user.id);
    }
  });
};
