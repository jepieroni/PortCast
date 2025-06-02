
import { useMemo } from 'react';
import { Port } from '@/components/shipment-registration/types';
import { usePortRegions } from './usePortRegions';
import { useRateAreaRegions } from './useRateAreaRegions';

export const useFilteredPorts = (ports: Port[], selectedRateArea: string) => {
  const { portRegions, portRegionMemberships } = usePortRegions();
  const { rateAreaRegionMemberships } = useRateAreaRegions();

  const filteredPorts = useMemo(() => {
    if (!selectedRateArea || !rateAreaRegionMemberships.length || !portRegionMemberships.length) {
      return ports;
    }

    // Find which region(s) the selected rate area belongs to
    const rateAreaRegions = rateAreaRegionMemberships
      .filter(membership => membership.rate_area_id === selectedRateArea)
      .map(membership => membership.region_id);

    if (rateAreaRegions.length === 0) {
      return ports;
    }

    // Find ports that are in the same region(s) as the rate area
    const portsInSameRegion = portRegionMemberships
      .filter(membership => rateAreaRegions.includes(membership.region_id))
      .map(membership => membership.port_id);

    // Filter the ports to only include those in the same region(s)
    return ports.filter(port => portsInSameRegion.includes(port.id));
  }, [ports, selectedRateArea, rateAreaRegionMemberships, portRegionMemberships]);

  return filteredPorts;
};
