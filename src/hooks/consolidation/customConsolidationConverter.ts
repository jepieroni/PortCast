
import { CustomConsolidationGroup } from './customConsolidationTypes';

export const convertDbToUIFormat = (dbConsolidations: any[]): CustomConsolidationGroup[] => {
  return dbConsolidations.map(dbConsolidation => {
    const originPort = dbConsolidation.origin_port;
    const destinationPort = dbConsolidation.destination_port;
    const originRegion = dbConsolidation.origin_region;
    const destinationRegion = dbConsolidation.destination_region;

    // Determine custom type
    let customType: CustomConsolidationGroup['custom_type'];
    let poe_name: string, poe_code: string, pod_name: string, pod_code: string;

    if (originRegion && destinationRegion) {
      customType = 'region_to_region';
      poe_name = `Region: ${originRegion.name}`;
      poe_code = '';
      pod_name = `Region: ${destinationRegion.name}`;
      pod_code = '';
    } else if (originRegion && destinationPort) {
      customType = 'region_to_port';
      poe_name = `Region: ${originRegion.name}`;
      poe_code = '';
      pod_name = destinationPort.name;
      pod_code = destinationPort.code;
    } else if (originPort && destinationRegion) {
      customType = 'port_to_region';
      poe_name = originPort.name;
      poe_code = originPort.code;
      pod_name = `Region: ${destinationRegion.name}`;
      pod_code = '';
    } else {
      customType = 'port_to_port';
      poe_name = originPort?.name || '';
      poe_code = originPort?.code || '';
      pod_name = destinationPort?.name || '';
      pod_code = destinationPort?.code || '';
    }

    return {
      poe_id: originPort?.id || dbConsolidation.origin_port_id || '',
      poe_name,
      poe_code,
      pod_id: destinationPort?.id || dbConsolidation.destination_port_id || '',
      pod_name,
      pod_code,
      shipment_count: 0, // Will be calculated from actual shipments
      total_cube: 0, // Will be calculated from actual shipments
      has_user_shipments: false, // Will be determined from actual shipments
      is_custom: true,
      custom_type: customType,
      origin_region_id: dbConsolidation.origin_region_id,
      origin_region_name: originRegion?.name,
      destination_region_id: dbConsolidation.destination_region_id,
      destination_region_name: destinationRegion?.name,
      combined_from: [], // This will need to be reconstructed or stored separately
      shipment_details: [],
      custom_id: dbConsolidation.id,
      db_id: dbConsolidation.id
    } as CustomConsolidationGroup;
  });
};
