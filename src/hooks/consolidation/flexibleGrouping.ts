
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

  // DEBUG: Log all shipments and their regions
  console.log('📦 ALL SHIPMENTS WITH REGIONS:');
  shipments.forEach((shipment, index) => {
    const poeRegion = shipment.poe?.port_region_memberships?.[0]?.region;
    const podRegion = shipment.pod?.port_region_memberships?.[0]?.region;
    console.log(`Shipment ${index + 1}:`, {
      poe: `${shipment.poe?.name} (${shipment.poe?.code}) - Region: ${poeRegion?.name}`,
      pod: `${shipment.pod?.name} (${shipment.pod?.code}) - Region: ${podRegion?.name}`,
      key: `${shipment.target_poe_id}-${shipment.target_pod_id}`
    });
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

    // Start with no flexibility
    let effectivePoeFlexible = false;
    let effectivePodFlexible = false;

    // Check for direct flexibility setting first
    const originalOriginDestinationKey = `${shipment.target_poe_id}-${shipment.target_pod_id}`;
    const directFlexibleSetting = flexibilitySettings.flexiblePorts[originalOriginDestinationKey];
    
    if (directFlexibleSetting) {
      effectivePoeFlexible = directFlexibleSetting.poeFlexible;
      effectivePodFlexible = directFlexibleSetting.podFlexible;
      console.log('✅ DIRECT FLEXIBILITY SETTING FOUND:', {
        key: originalOriginDestinationKey,
        poeFlexible: effectivePoeFlexible,
        podFlexible: effectivePodFlexible
      });
    }

    console.log('🔍 CHECKING REGIONAL FLEXIBILITY INHERITANCE:');
    
    // Check all flexibility settings to see if this shipment should inherit flexibility
    Object.entries(flexibilitySettings.flexiblePorts).forEach(([key, setting]) => {
      const [settingPoeId, settingPodId] = key.split('-');
      console.log(`  Checking setting ${key}:`, setting);
      
      // Find the shipment that matches this flexibility setting to get its region data
      const settingShipment = shipments.find(s => 
        s.target_poe_id === settingPoeId && s.target_pod_id === settingPodId
      );
      
      if (!settingShipment) {
        console.log(`    ⚠️ No shipment found for setting ${key}`);
        return;
      }

      const settingPoeRegion = settingShipment.poe?.port_region_memberships?.[0]?.region;
      const settingPodRegion = settingShipment.pod?.port_region_memberships?.[0]?.region;

      console.log(`    Setting regions: POE=${settingPoeRegion?.name}, POD=${settingPodRegion?.name}`);
      console.log(`    Current regions: POE=${poeRegion?.name}, POD=${podRegion?.name}`);

      // POE FLEXIBILITY INHERITANCE:
      // If the setting has POE flexible and same destination, check if origins are in same region
      if (setting.poeFlexible && shipment.target_pod_id === settingPodId && poeRegion?.id && settingPoeRegion?.id) {
        console.log(`    🔍 Checking POE flexibility inheritance:`);
        console.log(`      Same destination: ${shipment.target_pod_id} === ${settingPodId}`);
        console.log(`      Current POE region: ${poeRegion.name} (${poeRegion.id})`);
        console.log(`      Setting POE region: ${settingPoeRegion.name} (${settingPoeRegion.id})`);
        
        if (settingPoeRegion.id === poeRegion.id) {
          console.log(`    ✅ INHERITING POE FLEXIBILITY from ${key} (same region + same destination)`);
          effectivePoeFlexible = true;
        }
      }

      // POD FLEXIBILITY INHERITANCE:
      // If the setting has POD flexible and same origin, check if destinations are in same region
      if (setting.podFlexible && shipment.target_poe_id === settingPoeId && podRegion?.id && settingPodRegion?.id) {
        console.log(`    🔍 Checking POD flexibility inheritance:`);
        console.log(`      Same origin: ${shipment.target_poe_id} === ${settingPoeId}`);
        console.log(`      Current POD region: ${podRegion.name} (${podRegion.id})`);
        console.log(`      Setting POD region: ${settingPodRegion.name} (${settingPodRegion.id})`);
        
        if (settingPodRegion.id === podRegion.id) {
          console.log(`    ✅ INHERITING POD FLEXIBILITY from ${key} (same region + same origin)`);
          effectivePodFlexible = true;
        }
      }

      // ADDITIONAL CHECK: For POE flexibility, also check if we have the same destination and are in the same POE region
      // This handles the case where Norfolk->Bahrain should inherit flexibility from Baltimore->Bahrain
      if (setting.poeFlexible && shipment.target_pod_id === settingPodId && 
          poeRegion?.id && settingPoeRegion?.id && settingPoeRegion.id === poeRegion.id &&
          shipment.target_poe_id !== settingPoeId) {
        console.log(`    🔍 Additional POE regional check:`);
        console.log(`      Same destination: ${shipment.target_pod_id} === ${settingPodId} ✓`);
        console.log(`      Same POE region: ${poeRegion.name} === ${settingPoeRegion.name} ✓`);
        console.log(`      Different POE ports: ${shipment.target_poe_id} !== ${settingPoeId} ✓`);
        console.log(`    ✅ INHERITING POE FLEXIBILITY (regional inheritance)`);
        effectivePoeFlexible = true;
      }

      // ADDITIONAL CHECK: For POD flexibility, also check if we have the same origin and are in the same POD region
      if (setting.podFlexible && shipment.target_poe_id === settingPoeId && 
          podRegion?.id && settingPodRegion?.id && settingPodRegion.id === podRegion.id &&
          shipment.target_pod_id !== settingPodId) {
        console.log(`    🔍 Additional POD regional check:`);
        console.log(`      Same origin: ${shipment.target_poe_id} === ${settingPoeId} ✓`);
        console.log(`      Same POD region: ${podRegion.name} === ${settingPodRegion.name} ✓`);
        console.log(`      Different POD ports: ${shipment.target_pod_id} !== ${settingPodId} ✓`);
        console.log(`    ✅ INHERITING POD FLEXIBILITY (regional inheritance)`);
        effectivePodFlexible = true;
      }
    });

    console.log('🎯 Effective Flexibility Check:', { 
      originalOriginDestinationKey,
      directFlexibleSetting,
      effectivePoeFlexible, 
      effectivePodFlexible,
      poeRegionId: poeRegion?.id,
      podRegionId: podRegion?.id
    });

    // Create grouping key based on effective flexibility
    let groupKey: string;
    let groupData: Partial<ConsolidationGroup>;

    if (effectivePoeFlexible && effectivePodFlexible) {
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
    } else if (effectivePoeFlexible) {
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
        pod_region_id: podRegion?.id,
        pod_region_name: podRegion?.name,
        is_poe_flexible: true,
        is_pod_flexible: false
      };
    } else if (effectivePodFlexible) {
      console.log('🔄 POE strict, POD flexible - grouping by specific POE + POD region');
      groupKey = `${shipment.target_poe_id}-region-${podRegion?.id || 'unknown'}`;
      groupData = {
        poe_id: shipment.target_poe_id,
        poe_name: poeData.name || 'Unknown POE',
        poe_code: poeData.code || '',
        pod_id: podRegion?.id || shipment.target_pod_id,
        pod_name: podRegion?.name || podData.name,
        pod_code: podRegion?.name || podData.code,
        poe_region_id: poeRegion?.id,
        poe_region_name: poeRegion?.name,
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
        poe_region_id: poeRegion?.id,
        poe_region_name: poeRegion?.name,
        pod_region_id: podRegion?.id,
        pod_region_name: podRegion?.name,
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
    } else {
      console.log(`📝 Adding to existing group: ${groupKey}`);
    }

    groupedData[groupKey].shipment_count += 1;
    groupedData[groupKey].total_cube += shipment.actual_cube || shipment.estimated_cube || 0;
    
    if (shipment.user_id === userId) {
      groupedData[groupKey].has_user_shipments = true;
    }

    // Track individual ports within flexible groups
    if (effectivePoeFlexible || effectivePodFlexible) {
      const group = groupedData[groupKey];
      if (effectivePoeFlexible && !group.grouped_ports?.poe_ports?.find(p => p.id === shipment.target_poe_id)) {
        group.grouped_ports?.poe_ports?.push({
          id: shipment.target_poe_id,
          name: poeData.name,
          code: poeData.code
        });
        console.log(`  📍 Added POE port to group: ${poeData.name} (${poeData.code})`);
      }
      if (effectivePodFlexible && !group.grouped_ports?.pod_ports?.find(p => p.id === shipment.target_pod_id)) {
        group.grouped_ports?.pod_ports?.push({
          id: shipment.target_pod_id,
          name: podData.name,
          code: podData.code
        });
        console.log(`  📍 Added POD port to group: ${podData.name} (${podData.code})`);
      }
    }

    console.log(`✅ Updated group ${groupKey}:`, {
      shipment_count: groupedData[groupKey].shipment_count,
      total_cube: groupedData[groupKey].total_cube,
      grouped_ports: groupedData[groupKey].grouped_ports
    });
  });

  const result = Object.values(groupedData);
  console.log('✅ FLEXIBLE GROUPING COMPLETE:', {
    totalGroups: result.length,
    groupKeys: Object.keys(groupedData),
    groups: result
  });
  return result;
}
