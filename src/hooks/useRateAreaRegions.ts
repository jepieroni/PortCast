
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RateAreaRegionMembership } from '@/components/shipment-registration/types';

export const useRateAreaRegions = () => {
  const { data: rateAreaRegionMemberships = [] } = useQuery({
    queryKey: ['rate-area-region-memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_area_region_memberships')
        .select('*');
      
      if (error) throw error;
      return data as RateAreaRegionMembership[];
    }
  });

  return { rateAreaRegionMemberships };
};
