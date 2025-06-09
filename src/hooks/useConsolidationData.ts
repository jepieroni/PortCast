
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConsolidationGroup {
  poe_id: string;
  poe_name: string;
  poe_code: string;
  pod_id: string;
  pod_name: string;
  pod_code: string;
  shipment_count: number;
  total_cube: number;
  has_user_shipments: boolean;
  // New fields for flexible grouping
  poe_region_id?: string;
  poe_region_name?: string;
  pod_region_id?: string;
  pod_region_name?: string;
  is_poe_flexible?: boolean;
  is_pod_flexible?: boolean;
  grouped_ports?: {
    poe_ports?: Array<{ id: string; name: string; code: string }>;
    pod_ports?: Array<{ id: string; name: string; code: string }>;
  };
}

export interface FlexibilitySettings {
  flexiblePorts: {
    [portId: string]: {
      poeFlexible: boolean;
      podFlexible: boolean;
    };
  };
}

export const useConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number[],
  flexibilitySettings?: FlexibilitySettings
) => {
  return useQuery({
    queryKey: ['consolidation-data', type, outlookDays[0], flexibilitySettings],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range - include past 30 days and future outlook days
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + outlookDays[0]);

      console.log('Consolidation query date range:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        type,
        flexibilitySettings
      });

      // Fetch shipments with POE/POD and region information
      let query = supabase
        .from('shipments')
        .select(`
          target_poe_id,
          target_pod_id,
          actual_cube,
          estimated_cube,
          user_id,
          pickup_date,
          poe:target_poe_id(
            id, 
            name, 
            code,
            port_region_memberships(
              region:region_id(id, name)
            )
          ),
          pod:target_pod_id(
            id, 
            name, 
            code,
            port_region_memberships(
              region:region_id(id, name)
            )
          )
        `)
        .eq('shipment_type', type)
        .gte('pickup_date', startDate.toISOString().split('T')[0])
        .lte('pickup_date', endDate.toISOString().split('T')[0]);

      const { data: shipments, error } = await query;

      if (error) throw error;

      console.log('Consolidation shipments found:', shipments?.length || 0, shipments);

      if (!flexibilitySettings) {
        // Original strict grouping logic
        return processStrictGrouping(shipments, user.id);
      } else {
        // New flexible grouping logic
        return processFlexibleGrouping(shipments, user.id, flexibilitySettings);
      }
    }
  });
};

function processStrictGrouping(shipments: any[], userId: string): ConsolidationGroup[] {
  const groupedData: { [key: string]: ConsolidationGroup } = {};

  shipments?.forEach((shipment) => {
    const poeData = shipment.poe as any;
    const podData = shipment.pod as any;
    
    if (!poeData || !podData) {
      console.warn('Skipping shipment without POE/POD data:', shipment);
      return;
    }

    const key = `${shipment.target_poe_id}-${shipment.target_pod_id}`;
    
    if (!groupedData[key]) {
      groupedData[key] = {
        poe_id: shipment.target_poe_id,
        poe_name: poeData.name || 'Unknown POE',
        poe_code: poeData.code || '',
        pod_id: shipment.target_pod_id,
        pod_name: podData.name || 'Unknown POD',
        pod_code: podData.code || '',
        shipment_count: 0,
        total_cube: 0,
        has_user_shipments: false,
        is_poe_flexible: false,
        is_pod_flexible: false
      };
    }

    groupedData[key].shipment_count += 1;
    groupedData[key].total_cube += shipment.actual_cube || shipment.estimated_cube || 0;
    
    if (shipment.user_id === userId) {
      groupedData[key].has_user_shipments = true;
    }
  });

  return Object.values(groupedData);
}

function processFlexibleGrouping(shipments: any[], userId: string, flexibilitySettings: FlexibilitySettings): ConsolidationGroup[] {
  const groupedData: { [key: string]: ConsolidationGroup } = {};

  shipments?.forEach((shipment) => {
    const poeData = shipment.poe as any;
    const podData = shipment.pod as any;
    
    if (!poeData || !podData) {
      console.warn('Skipping shipment without POE/POD data:', shipment);
      return;
    }

    // Determine if this shipment's ports should use flexible grouping
    const poeFlexible = Object.values(flexibilitySettings.flexiblePorts).some(
      settings => settings.poeFlexible && 
      (poeData.port_region_memberships?.[0]?.region?.id === 
       Object.keys(flexibilitySettings.flexiblePorts).find(portId => 
         flexibilitySettings.flexiblePorts[portId].poeFlexible
       ))
    );

    const podFlexible = Object.values(flexibilitySettings.flexiblePorts).some(
      settings => settings.podFlexible && 
      (podData.port_region_memberships?.[0]?.region?.id === 
       Object.keys(flexibilitySettings.flexiblePorts).find(portId => 
         flexibilitySettings.flexiblePorts[portId].podFlexible
       ))
    );

    // Create grouping key based on flexibility
    let groupKey: string;
    let groupData: Partial<ConsolidationGroup>;

    if (poeFlexible && podFlexible) {
      // Both flexible - group by regions
      const poeRegion = poeData.port_region_memberships?.[0]?.region;
      const podRegion = podData.port_region_memberships?.[0]?.region;
      groupKey = `region-${poeRegion?.id || 'unknown'}-region-${podRegion?.id || 'unknown'}`;
      groupData = {
        poe_id: poeRegion?.id || shipment.target_poe_id,
        poe_name: poeRegion?.name || poeData.name,
        poe_code: poeRegion?.name || poeData.code,
        pod_id: podRegion?.id || shipment.target_pod_id,
        pod_name: podRegion?.name || podData.name,
        pod_code: podRegion?.name || podData.code,
        poe_region_id: poeRegion?.id,
        poe_region_name: poeRegion?.name,
        pod_region_id: podRegion?.id,
        pod_region_name: podRegion?.name,
        is_poe_flexible: true,
        is_pod_flexible: true
      };
    } else if (poeFlexible) {
      // POE flexible, POD strict
      const poeRegion = poeData.port_region_memberships?.[0]?.region;
      groupKey = `region-${poeRegion?.id || 'unknown'}-${shipment.target_pod_id}`;
      groupData = {
        poe_id: poeRegion?.id || shipment.target_poe_id,
        poe_name: poeRegion?.name || poeData.name,
        poe_code: poeRegion?.name || poeData.code,
        pod_id: shipment.target_pod_id,
        pod_name: podData.name || 'Unknown POD',
        pod_code: podData.code || '',
        poe_region_id: poeRegion?.id,
        poe_region_name: poeRegion?.name,
        is_poe_flexible: true,
        is_pod_flexible: false
      };
    } else if (podFlexible) {
      // POE strict, POD flexible
      const podRegion = podData.port_region_memberships?.[0]?.region;
      groupKey = `${shipment.target_poe_id}-region-${podRegion?.id || 'unknown'}`;
      groupData = {
        poe_id: shipment.target_poe_id,
        poe_name: poeData.name || 'Unknown POE',
        poe_code: poeData.code || '',
        pod_id: podRegion?.id || shipment.target_pod_id,
        pod_name: podRegion?.name || podData.name,
        pod_code: podRegion?.name || podData.code,
        pod_region_id: podRegion?.id,
        pod_region_name: podRegion?.name,
        is_poe_flexible: false,
        is_pod_flexible: true
      };
    } else {
      // Both strict - original logic
      groupKey = `${shipment.target_poe_id}-${shipment.target_pod_id}`;
      groupData = {
        poe_id: shipment.target_poe_id,
        poe_name: poeData.name || 'Unknown POE',
        poe_code: poeData.code || '',
        pod_id: shipment.target_pod_id,
        pod_name: podData.name || 'Unknown POD',
        pod_code: podData.code || '',
        is_poe_flexible: false,
        is_pod_flexible: false
      };
    }

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        ...groupData,
        shipment_count: 0,
        total_cube: 0,
        has_user_shipments: false,
        grouped_ports: { poe_ports: [], pod_ports: [] }
      } as ConsolidationGroup;
    }

    groupedData[groupKey].shipment_count += 1;
    groupedData[groupKey].total_cube += shipment.actual_cube || shipment.estimated_cube || 0;
    
    if (shipment.user_id === userId) {
      groupedData[groupKey].has_user_shipments = true;
    }

    // Track individual ports within flexible groups
    if (poeFlexible || podFlexible) {
      const group = groupedData[groupKey];
      if (poeFlexible && !group.grouped_ports?.poe_ports?.find(p => p.id === shipment.target_poe_id)) {
        group.grouped_ports?.poe_ports?.push({
          id: shipment.target_poe_id,
          name: poeData.name,
          code: poeData.code
        });
      }
      if (podFlexible && !group.grouped_ports?.pod_ports?.find(p => p.id === shipment.target_pod_id)) {
        group.grouped_ports?.pod_ports?.push({
          id: shipment.target_pod_id,
          name: podData.name,
          code: podData.code
        });
      }
    }
  });

  const result = Object.values(groupedData);
  console.log('Consolidation groups with flexibility:', result);
  return result;
}
