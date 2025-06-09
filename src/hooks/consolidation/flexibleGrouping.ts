
import { ConsolidationGroup, ShipmentData, FlexibilitySettings } from './types';

export function processFlexibleGrouping(
  shipments: ShipmentData[], 
  userId: string, 
  flexibilitySettings: FlexibilitySettings
): ConsolidationGroup[] {
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

    const poeData = shipment.poe;
    const podData = shipment.pod;
    
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

    // Check flexibility for this specific origin-destination pair
    const originDestinationKey = `${shipment.target_poe_id}-${shipment.target_pod_id}`;
    const flexibleSetting = flexibilitySettings.flexiblePorts[originDestinationKey];
    
    const poeFlexible = flexibleSetting?.poeFlexible || false;
    const podFlexible = flexibleSetting?.podFlexible || false;

    console.log('🎯 Origin-Destination Flexibility Check:', { 
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
