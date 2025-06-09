
import { ConsolidationGroup, ShipmentData } from './types';

export function processStrictGrouping(shipments: ShipmentData[], userId: string): ConsolidationGroup[] {
  console.log('🔒 PROCESSING STRICT GROUPING');
  const groupedData: { [key: string]: ConsolidationGroup } = {};

  shipments?.forEach((shipment, index) => {
    console.log(`📦 Processing shipment ${index + 1}:`, {
      poe: shipment.poe,
      pod: shipment.pod,
      cube: shipment.actual_cube || shipment.estimated_cube
    });

    const poeData = shipment.poe;
    const podData = shipment.pod;
    
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
