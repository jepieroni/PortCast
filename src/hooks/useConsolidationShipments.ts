
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
  console.log('🔍 useConsolidationShipments called with:', {
    type,
    poeId,
    podId,
    outlookDays,
    isCustom: customConsolidationData?.is_custom,
    customId: customConsolidationData?.db_id || customConsolidationData?.custom_id
  });

  // If this is a custom consolidation, use the dedicated hook
  const customConsolidationId = customConsolidationData?.is_custom ? customConsolidationData.db_id : null;
  const { data: customDetails, isLoading: customLoading, error: customError } = useCustomConsolidationDetails(customConsolidationId);

  // Regular consolidation query
  const regularQuery = useQuery({
    queryKey: ['consolidation-shipments', type, poeId, podId, outlookDays[0]],
    queryFn: async () => {
      console.log('🔍 Starting regular shipment fetch with params:', {
        type,
        poeId,
        podId,
        outlookDays: outlookDays[0]
      });

      debugLogger.info('CONSOLIDATION-SHIPMENTS', 'Fetching regular consolidation shipments', 'useConsolidationShipments', {
        type,
        poeId,
        podId,
        outlookDays: outlookDays[0]
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + outlookDays[0]);

      console.log('🔍 Date range for query:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

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
        console.log('🔍 Added shipment_type filter:', type);
      } else {
        query = query.eq('shipment_type', 'intertheater');
        console.log('🔍 Added shipment_type filter: intertheater');
      }

      console.log('🔍 About to execute shipments query...');
      const { data: shipments, error } = await query;

      console.log('🔍 Query completed:', {
        shipmentsCount: shipments?.length || 0,
        error: error?.message || 'none',
        firstShipment: shipments?.[0] ? {
          id: shipments[0].id,
          gbl: shipments[0].gbl_number,
          poe_id: shipments[0].target_poe_id,
          pod_id: shipments[0].target_pod_id,
          pickup_date: shipments[0].pickup_date,
          shipment_type: shipments[0].shipment_type
        } : 'none'
      });

      if (error) {
        console.error('❌ Error fetching regular consolidation shipments:', error);
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
    console.log('🔍 Returning custom consolidation data:', {
      customConsolidationId,
      isLoading: customLoading,
      hasData: !!customDetails,
      shipmentCount: customDetails?.shipments?.length || 0
    });

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

  console.log('🔍 Returning regular consolidation data:', {
    isLoading: regularQuery.isLoading,
    hasData: !!regularQuery.data,
    shipmentCount: regularQuery.data?.length || 0,
    error: regularQuery.error?.message || 'none'
  });

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
