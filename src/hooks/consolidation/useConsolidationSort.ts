
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
      if ('is_custom' in consolidation) {
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

    return [...consolidations].sort((a, b) => {
      const aKey = getSortKey(a);
      const bKey = getSortKey(b);
      return aKey.localeCompare(bKey);
    });
  }, [consolidations, portRegions, portRegionMemberships, type]);
};
