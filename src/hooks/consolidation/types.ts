
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
