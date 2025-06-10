
import { useMemo } from 'react';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';

export const useConsolidationSort = (
  consolidations: ExtendedConsolidationGroup[],
  portRegions: any[],
  portRegionMemberships: any[],
  type: 'inbound' | 'outbound' | 'intertheater'
) => {
  return useMemo(() => {
    if (!consolidations || consolidations.length === 0) return [];

    console.log('🔄 useConsolidationSort: Sorting consolidations', {
      count: consolidations.length,
      type,
      customCount: consolidations.filter(c => 'is_custom' in c && c.is_custom).length,
      regularCount: consolidations.filter(c => !('is_custom' in c && c.is_custom)).length
    });

    const getPortRegionName = (portId: string) => {
      const membership = portRegionMemberships.find(m => m.port_id === portId);
      if (membership) {
        const region = portRegions.find(r => r.id === membership.region_id);
        return region?.name || 'Unknown Region';
      }
      return 'No Region';
    };

    const getSortKey = (consolidation: ExtendedConsolidationGroup) => {
      // For custom cards, use the region names directly if available
      if ('is_custom' in consolidation && consolidation.is_custom) {
        if (type === 'inbound' || type === 'intertheater') {
          return consolidation.origin_region_name || getPortRegionName(consolidation.poe_id);
        } else { // outbound
          return consolidation.destination_region_name || getPortRegionName(consolidation.pod_id);
        }
      }

      // For regular cards, get region from port membership
      if (type === 'inbound' || type === 'intertheater') {
        return getPortRegionName(consolidation.poe_id);
      } else { // outbound
        return getPortRegionName(consolidation.pod_id);
      }
    };

    // Separate custom and regular consolidations
    const customConsolidations = consolidations.filter(c => 'is_custom' in c && c.is_custom);
    const regularConsolidations = consolidations.filter(c => !('is_custom' in c && c.is_custom));

    // Sort custom consolidations by their region names
    const sortedCustom = [...customConsolidations].sort((a, b) => {
      const aKey = getSortKey(a);
      const bKey = getSortKey(b);
      return aKey.localeCompare(bKey);
    });

    // Sort regular consolidations by their region names  
    const sortedRegular = [...regularConsolidations].sort((a, b) => {
      const aKey = getSortKey(a);
      const bKey = getSortKey(b);
      return aKey.localeCompare(bKey);
    });

    // Return custom consolidations first, then regular consolidations
    const result = [...sortedCustom, ...sortedRegular];
    
    console.log('🔄 useConsolidationSort: Sort completed', {
      customCount: sortedCustom.length,
      regularCount: sortedRegular.length,
      totalCount: result.length
    });

    return result;
  }, [consolidations, portRegions, portRegionMemberships, type]);
};
