
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PortRegion, PortRegionMembership } from '@/components/shipment-registration/types';

export const usePortRegions = () => {
  const { data: portRegions = [] } = useQuery({
    queryKey: ['port-regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('port_regions')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as PortRegion[];
    }
  });

  const { data: portRegionMemberships = [] } = useQuery({
    queryKey: ['port-region-memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('port_region_memberships')
        .select('*');
      
      if (error) throw error;
      return data as PortRegionMembership[];
    }
  });

  return { portRegions, portRegionMemberships };
};
