
/**
 * Utility for mapping shipment data to form data structure
 */
export interface ShipmentEditFormData {
  gbl_number: string;
  shipper_last_name: string;
  shipment_type: string;
  origin_rate_area: string;
  destination_rate_area: string;
  pickup_date: string;
  rdd: string;
  estimated_cube: string;
  actual_cube: string;
  remaining_cube: string;
  target_poe_id: string;
  target_pod_id: string;
  tsp_id: string;
}

export const createInitialFormData = (): ShipmentEditFormData => ({
  gbl_number: '',
  shipper_last_name: '',
  shipment_type: '',
  origin_rate_area: '',
  destination_rate_area: '',
  pickup_date: '',
  rdd: '',
  estimated_cube: '',
  actual_cube: '',
  remaining_cube: '',
  target_poe_id: '',
  target_pod_id: '',
  tsp_id: '',
});

export const mapShipmentToFormData = (shipment: any): ShipmentEditFormData => {
  if (!shipment) return createInitialFormData();

  return {
    gbl_number: shipment.gbl_number || '',
    shipper_last_name: shipment.shipper_last_name || '',
    shipment_type: shipment.shipment_type || '',
    origin_rate_area: shipment.origin_rate_area || '',
    destination_rate_area: shipment.destination_rate_area || '',
    pickup_date: shipment.pickup_date || '',
    rdd: shipment.rdd || '',
    estimated_cube: shipment.estimated_cube?.toString() || '',
    actual_cube: shipment.actual_cube?.toString() || '',
    remaining_cube: shipment.remaining_cube?.toString() || '',
    target_poe_id: shipment.target_poe_id || '',
    target_pod_id: shipment.target_pod_id || '',
    tsp_id: shipment.tsp_id || '',
  };
};
