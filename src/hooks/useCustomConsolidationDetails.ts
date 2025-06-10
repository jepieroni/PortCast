
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/services/debugLogger';

export const useCustomConsolidationDetails = (customConsolidationId: string | null) => {
  return useQuery({
    queryKey: ['custom-consolidation-details', customConsolidationId],
    queryFn: async () => {
      if (!customConsolidationId) return null;

      debugLogger.info('CUSTOM-CONSOLIDATION-DETAILS', 'Fetching custom consolidation details', 'useCustomConsolidationDetails', {
        customConsolidationId
      });

      // Get the custom consolidation record with its relationships
      const { data: consolidation, error: consolidationError } = await supabase
        .from('custom_consolidations')
        .select(`
          *,
          origin_port:ports!custom_consolidations_origin_port_id_fkey(*),
          destination_port:ports!custom_consolidations_destination_port_id_fkey(*),
          origin_region:port_regions!custom_consolidations_origin_region_id_fkey(*),
          destination_region:port_regions!custom_consolidations_destination_region_id_fkey(*)
        `)
        .eq('id', customConsolidationId)
        .single();

      if (consolidationError) {
        debugLogger.error('CUSTOM-CONSOLIDATION-DETAILS', 'Error fetching consolidation', 'useCustomConsolidationDetails', {
          error: consolidationError,
          customConsolidationId
        });
        throw consolidationError;
      }

      // Get all shipments associated with this custom consolidation
      const { data: memberships, error: membershipError } = await supabase
        .from('custom_consolidation_memberships')
        .select(`
          shipment_id,
          shipments:shipment_id (
            *,
            tsp:tsps(*),
            target_poe:ports!shipments_target_poe_id_fkey(*),
            target_pod:ports!shipments_target_pod_id_fkey(*)
          )
        `)
        .eq('custom_consolidation_id', customConsolidationId);

      if (membershipError) {
        debugLogger.error('CUSTOM-CONSOLIDATION-DETAILS', 'Error fetching memberships', 'useCustomConsolidationDetails', {
          error: membershipError,
          customConsolidationId
        });
        throw membershipError;
      }

      const shipments = memberships?.map(m => m.shipments).filter(Boolean) || [];

      debugLogger.info('CUSTOM-CONSOLIDATION-DETAILS', 'Successfully fetched custom consolidation details', 'useCustomConsolidationDetails', {
        customConsolidationId,
        shipmentCount: shipments.length,
        consolidationType: consolidation.consolidation_type
      });

      return {
        consolidation,
        shipments
      };
    },
    enabled: !!customConsolidationId
  });
};
