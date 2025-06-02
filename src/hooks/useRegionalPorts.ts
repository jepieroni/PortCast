
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Port } from '@/components/shipment-registration/types';

export const useRegionalPorts = (regionId?: string) => {
  return useQuery({
    queryKey: ['regional-ports', regionId],
    queryFn: async () => {
      if (!regionId) {
        // Return all ports if no region specified
        const { data, error } = await supabase
          .from('ports')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data as Port[];
      }

      // Get ports in specific region
      const { data, error } = await supabase
        .from('ports')
        .select(`
          *,
          port_region_memberships!inner(
            region_id
          )
        `)
        .eq('port_region_memberships.region_id', regionId)
        .order('name');
      
      if (error) throw error;
      return data as Port[];
    },
    enabled: true
  });
};
