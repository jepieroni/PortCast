
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
        .select('*');

      // If not global admin, filter by organization
      if (!isGlobalAdmin) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (userProfile?.organization_id) {
          // Get all users in the same organization
          const { data: orgUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', userProfile.organization_id);

          if (orgUsers && orgUsers.length > 0) {
            const userIds = orgUsers.map(u => u.id);
            query = query.in('user_id', userIds);
          }
        }
      }

      // Apply filters
      if (filters.search) {
        query = query.or(`gbl_number.ilike.%${filters.search}%,shipper_last_name.ilike.%${filters.search}%`);
      }

      if (filters.shipmentType && filters.shipmentType !== 'all') {
        query = query.eq('shipment_type', filters.shipmentType);
      }

      if (filters.dateFrom) {
        query = query.gte('pickup_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('pickup_date', filters.dateTo);
      }

      query = query.order('created_at', { ascending: false });

      const { data: shipments, error } = await query;
      if (error) throw error;

      // Always return an array, even if empty
      if (!shipments || shipments.length === 0) {
        return [];
      }

      // Fetch profile and organization info for each shipment
      const userIds = [...new Set(shipments.map(s => s.user_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          organization_id,
          organizations!inner(name)
        `)
        .in('id', userIds);

      // Attach profile data to shipments
      const enrichedShipments = shipments.map(shipment => {
        const profile = profiles?.find(p => p.id === shipment.user_id);
        return {
          ...shipment,
          profiles: profile ? {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            organizations: {
              name: profile.organizations?.name || 'Unknown'
            }
          } : {
            first_name: '',
            last_name: '',
            organizations: { name: 'Unknown' }
          }
        };
      });

      return enrichedShipments;
    }
  });
};
