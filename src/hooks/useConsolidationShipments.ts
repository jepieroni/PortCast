
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/services/debugLogger';
import { useCustomConsolidationDetails } from './useCustomConsolidationDetails';

export const useConsolidationShipments = (
  type: 'inbound' | 'outbound' | 'intertheater',
  poeId: string,
  podId: string,
  outlookDays: number[],
  customConsolidationData?: any // For custom consolidations
) => {
  // If this is a custom consolidation, use the dedicated hook
  const customConsolidationId = customConsolidationData?.is_custom ? customConsolidationData.db_id : null;
  const { data: customDetails, isLoading: customLoading, error: customError } = useCustomConsolidationDetails(customConsolidationId);

  // Regular consolidation query
  const regularQuery = useQuery({
    queryKey: ['consolidation-shipments', type, poeId, podId, outlookDays[0]],
    queryFn: async () => {
      debugLogger.info('CONSOLIDATION-SHIPMENTS', 'Fetching regular consolidation shipments', 'useConsolidationShipments', {
        type,
        poeId,
        podId,
        outlookDays: outlookDays[0]
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + outlookDays[0]);

      let query = supabase
        .from('shipments')
        .select(`
          *,
          tsp:tsps(*),
          target_poe:ports!shipments_target_poe_id_fkey(*),
          target_pod:ports!shipments_target_pod_id_fkey(*)
        `)
        .eq('target_poe_id', poeId)
        .eq('target_pod_id', podId)
        .gte('pickup_date', startDate.toISOString().split('T')[0])
        .lte('pickup_date', endDate.toISOString().split('T')[0]);

      // Apply shipment type filter
      if (type !== 'intertheater') {
        query = query.eq('shipment_type', type);
      } else {
        query = query.eq('shipment_type', 'intertheater');
      }

      const { data: shipments, error } = await query;

      if (error) {
        debugLogger.error('CONSOLIDATION-SHIPMENTS', 'Error fetching regular consolidation shipments', 'useConsolidationShipments', {
          error: error.message,
          type,
          poeId,
          podId
        });
        throw error;
      }

      debugLogger.info('CONSOLIDATION-SHIPMENTS', 'Successfully fetched regular consolidation shipments', 'useConsolidationShipments', {
        count: shipments?.length || 0,
        type,
        route: `${poeId} → ${podId}`
      });

      return shipments || [];
    },
    enabled: !customConsolidationId // Only run for regular consolidations
  });

  // Return appropriate data based on consolidation type
  if (customConsolidationId) {
    debugLogger.debug('CONSOLIDATION-SHIPMENTS', 'Returning custom consolidation data', 'useConsolidationShipments', {
      customConsolidationId,
      isLoading: customLoading,
      hasData: !!customDetails,
      shipmentCount: customDetails?.shipments?.length || 0
    });

    return {
      data: customDetails?.shipments || [],
      isLoading: customLoading,
      error: customError
    };
  }

  debugLogger.debug('CONSOLIDATION-SHIPMENTS', 'Returning regular consolidation data', 'useConsolidationShipments', {
    isLoading: regularQuery.isLoading,
    hasData: !!regularQuery.data,
    shipmentCount: regularQuery.data?.length || 0
  });

  return {
    data: regularQuery.data || [],
    isLoading: regularQuery.isLoading,
    error: regularQuery.error
  };
};
