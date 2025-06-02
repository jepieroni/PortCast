
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useShipments = (filters: any) => {
  const { isGlobalAdmin } = useAuth();

  return useQuery({
    queryKey: ['shipments', filters, isGlobalAdmin],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('shipments')
        .select(`
          *,
          profiles!inner(
            first_name,
            last_name,
            organization_id,
            organizations!inner(
              name
            )
          )
        `);

      // If not global admin, filter by organization
      if (!isGlobalAdmin) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (userProfile?.organization_id) {
          query = query.eq('profiles.organization_id', userProfile.organization_id);
        }
      }

      // Apply filters
      if (filters.search) {
        query = query.or(`gbl_number.ilike.%${filters.search}%,shipper_last_name.ilike.%${filters.search}%`);
      }

      if (filters.shipmentType) {
        query = query.eq('shipment_type', filters.shipmentType);
      }

      if (filters.dateFrom) {
        query = query.gte('pickup_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('pickup_date', filters.dateTo);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data;
    }
  });
};
