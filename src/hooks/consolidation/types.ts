
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
}

export interface FlexibilitySettings {
  flexiblePorts: {
    [originDestinationKey: string]: {
      poeFlexible: boolean;
      podFlexible: boolean;
    };
  };
}

export interface ShipmentData {
  target_poe_id: string;
  target_pod_id: string;
  actual_cube: number;
  estimated_cube: number;
  user_id: string;
  pickup_date: string;
  poe: {
    id: string;
    name: string;
    code: string;
    port_region_memberships: Array<{
      region: { id: string; name: string };
    }>;
  };
  pod: {
    id: string;
    name: string;
    code: string;
    port_region_memberships: Array<{
      region: { id: string; name: string };
    }>;
  };
}
