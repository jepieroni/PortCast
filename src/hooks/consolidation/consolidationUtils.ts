
import { useCallback } from 'react';
import { ExtendedConsolidationGroup } from './dragDropTypes';
import { CustomConsolidationGroup } from '../useCustomConsolidations';

export const useConsolidationUtils = (portRegions: any[], portRegionMemberships: any[]) => {
  const getPortRegion = useCallback((portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    if (membership) {
      const region = portRegions.find(r => r.id === membership.region_id);
      return { id: membership.region_id, name: region?.name || 'Unknown Region' };
    }
    return null;
  }, [portRegions, portRegionMemberships]);

  const canDrop = useCallback((source: ExtendedConsolidationGroup, target: ExtendedConsolidationGroup) => {
    if (source.poe_id === target.poe_id && source.pod_id === target.pod_id) return false;

    const sourceOriginRegion = getPortRegion(source.poe_id);
    const sourceDestRegion = getPortRegion(source.pod_id);
    const targetOriginRegion = getPortRegion(target.poe_id);
    const targetDestRegion = getPortRegion(target.pod_id);

    const originRegionsMatch = sourceOriginRegion?.id === targetOriginRegion?.id;
    const destRegionsMatch = sourceDestRegion?.id === targetDestRegion?.id;

    return originRegionsMatch && destRegionsMatch;
  }, [getPortRegion]);

  const getValidDropTargets = useCallback((source: ExtendedConsolidationGroup, consolidations: ExtendedConsolidationGroup[]) => {
    return consolidations.filter(card => card !== source && canDrop(source, card));
  }, [canDrop]);

  return {
    getPortRegion,
    canDrop,
    getValidDropTargets
  };
};
