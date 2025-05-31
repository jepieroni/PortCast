
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RateArea, TSP, Port } from '../types';

export const useShipmentData = () => {
  // Fetch rate areas
  const { data: rateAreas = [] } = useQuery({
    queryKey: ['rate-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_areas')
        .select(`
          *,
          countries (name)
        `)
        .order('rate_area');
      
      if (error) throw error;
      return data as RateArea[];
    }
  });

  // Fetch ports
  const { data: ports = [] } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ports')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Port[];
    }
  });

  // Fetch TSPs for user's organization only, sorted by SCAC code
  const { data: tsps = [] } = useQuery({
    queryKey: ['tsps-user-org'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      if (!profile?.organization_id) throw new Error('User organization not found');

      const { data, error } = await supabase
        .from('tsps')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('scac_code');
      
      if (error) throw error;
      return data as TSP[];
    }
  });

  return { rateAreas, ports, tsps };
};
