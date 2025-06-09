
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchConsolidationShipments } from './consolidation/consolidationService';
import { processStrictGrouping } from './consolidation/strictGrouping';
import { processFlexibleGrouping } from './consolidation/flexibleGrouping';

// Re-export types for backward compatibility
export type { ConsolidationGroup, FlexibilitySettings } from './consolidation/types';

export const useConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[],
  flexibilitySettings?: import('./consolidation/types').FlexibilitySettings
) => {
  return useQuery({
    queryKey: ['consolidation-data', type, outlookDays[0], flexibilitySettings],
    queryFn: async () => {
      console.log('📊 Query Parameters:', {
        type,
        outlookDays: outlookDays[0],
        flexibilitySettings: JSON.stringify(flexibilitySettings, null, 2)
      });

      const shipments = await fetchConsolidationShipments(type, outlookDays[0]);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!flexibilitySettings || Object.keys(flexibilitySettings.flexiblePorts).length === 0) {
        console.log('🔒 Using STRICT grouping (no flexibility settings)');
        return processStrictGrouping(shipments, user.id);
      } else {
        console.log('🔄 Using FLEXIBLE grouping with settings:', flexibilitySettings);
        return processFlexibleGrouping(shipments, user.id, flexibilitySettings);
      }
    }
  });
};
