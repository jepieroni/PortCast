
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

// FIXED: Changed to track flexibility per origin-destination pair
export interface FlexibilitySettings {
  flexiblePorts: {
    [originDestinationKey: string]: {
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
      console.log('🔍 CONSOLIDATION DATA QUERY STARTED');
      console.log('📊 Query Parameters:', {
        type,
        outlookDays: outlookDays[0],
        flexibilitySettings: JSON.stringify(flexibilitySettings, null, 2)
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range - include past 30 days and future outlook days
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + outlookDays[0]);

      console.log('📅 Date Range:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        type,
        flexibilitySettings: flexibilitySettings ? 'PROVIDED' : 'NOT PROVIDED'
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

      if (error) {
        console.error('❌ Supabase Query Error:', error);
        throw error;
      }

      console.log('📦 Raw Shipments Data:', {
        count: shipments?.length || 0,
        sampleShipment: shipments?.[0] || 'NO SHIPMENTS',
        allShipments: shipments
      });

      if (!flexibilitySettings || Object.keys(flexibilitySettings.flexiblePorts).length === 0) {
        console.log('🔒 Using STRICT grouping (no flexibility settings)');
        return processStrictGrouping(shipments, user.id);
      } else {
        console.log('🔄 Using FLEXIBLE grouping with settings:', flexibilitySettings);
        return processFlexibleGrouping(shipments, user.id, flexibilitySettings);
      }
    }
  });
};

function processStrictGrouping(shipments: any[], userId: string): ConsolidationGroup[] {
  console.log('🔒 PROCESSING STRICT GROUPING');
  const groupedData: { [key: string]: ConsolidationGroup } = {};

  shipments?.forEach((shipment, index) => {
    console.log(`📦 Processing shipment ${index + 1}:`, {
      poe: shipment.poe,
      pod: shipment.pod,
      cube: shipment.actual_cube || shipment.estimated_cube
    });

    const poeData = shipment.poe as any;
    const podData = shipment.pod as any;
    
    if (!poeData || !podData) {
      console.warn('⚠️ Skipping shipment without POE/POD data:', shipment);
      return;
    }

    const key = `${shipment.target_poe_id}-${shipment.target_pod_id}`;
    console.log(`🔑 Grouping key: ${key}`);
    
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
      console.log(`➕ Created new group: ${key}`, groupedData[key]);
    }

    groupedData[key].shipment_count += 1;
    groupedData[key].total_cube += shipment.actual_cube || shipment.estimated_cube || 0;
    
    if (shipment.user_id === userId) {
      groupedData[key].has_user_shipments = true;
    }
  });

  const result = Object.values(groupedData);
  console.log('✅ STRICT GROUPING COMPLETE:', result);
  return result;
}

function processFlexibleGrouping(shipments: any[], userId: string, flexibilitySettings: FlexibilitySettings): ConsolidationGroup[] {
  console.log('🔄 PROCESSING FLEXIBLE GROUPING');
  console.log('⚙️ Flexibility Settings Detail:', {
    flexiblePorts: flexibilitySettings.flexiblePorts,
    settingsCount: Object.keys(flexibilitySettings.flexiblePorts).length
  });

  const groupedData: { [key: string]: ConsolidationGroup } = {};

  shipments?.forEach((shipment, index) => {
    console.log(`\n📦 Processing shipment ${index + 1}:`);
    console.log('Raw shipment data:', {
      target_poe_id: shipment.target_poe_id,
      target_pod_id: shipment.target_pod_id,
      poe: shipment.poe,
      pod: shipment.pod
    });

    const poeData = shipment.poe as any;
    const podData = shipment.pod as any;
    
    if (!poeData || !podData) {
      console.warn('⚠️ Skipping shipment without POE/POD data:', shipment);
      return;
    }

    // Get region data
    const poeRegion = poeData.port_region_memberships?.[0]?.region;
    const podRegion = podData.port_region_memberships?.[0]?.region;

    console.log('🗺️ Region data:', {
      poeRegion,
      podRegion
    });

    // FIXED: Check flexibility for this specific origin-destination pair
    const originDestinationKey = `${shipment.target_poe_id}-${shipment.target_pod_id}`;
    const flexibleSetting = flexibilitySettings.flexiblePorts[originDestinationKey];
    
    const poeFlexible = flexibleSetting?.poeFlexible || false;
    const podFlexible = flexibleSetting?.podFlexible || false;

    console.log('🎯 FIXED Origin-Destination Flexibility Check:', { 
      originDestinationKey,
      flexibleSetting,
      poeFlexible, 
      podFlexible,
      poeRegionId: poeRegion?.id,
      podRegionId: podRegion?.id
    });

    // Create grouping key based on flexibility
    let groupKey: string;
    let groupData: Partial<ConsolidationGroup>;

    if (poeFlexible && podFlexible) {
      console.log('🔄 Both POE and POD flexible - grouping by regions');
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
      console.log('🔄 POE flexible, POD strict - grouping by POE region + specific POD');
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
      console.log('🔄 POE strict, POD flexible - grouping by specific POE + POD region');
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
      console.log('🔒 Both POE and POD strict - using original logic');
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

    console.log('🔑 Generated grouping key:', groupKey);
    console.log('📋 Group data:', groupData);

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        ...groupData,
        shipment_count: 0,
        total_cube: 0,
        has_user_shipments: false,
        grouped_ports: { poe_ports: [], pod_ports: [] }
      } as ConsolidationGroup;
      console.log(`➕ Created new flexible group: ${groupKey}`);
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

    console.log(`✅ Updated group ${groupKey}:`, {
      shipment_count: groupedData[groupKey].shipment_count,
      total_cube: groupedData[groupKey].total_cube
    });
  });

  const result = Object.values(groupedData);
  console.log('✅ FLEXIBLE GROUPING COMPLETE:', {
    totalGroups: result.length,
    groups: result
  });
  return result;
}
