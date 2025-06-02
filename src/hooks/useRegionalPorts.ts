
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

      // Get port IDs in the specific region first
      const { data: memberships, error: membershipError } = await supabase
        .from('port_region_memberships')
        .select('port_id')
        .eq('region_id', regionId);

      if (membershipError) throw membershipError;

      const portIds = memberships.map(m => m.port_id);

      if (portIds.length === 0) {
        return [] as Port[];
      }

      // Then get the ports
      const { data, error } = await supabase
        .from('ports')
        .select('*')
        .in('id', portIds)
        .order('name');
      
      if (error) throw error;
      return data as Port[];
    },
    enabled: true
  });
};
