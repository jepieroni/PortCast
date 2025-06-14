
export interface DatabaseCustomConsolidation {
  id: string;
  organization_id: string;
  consolidation_type: 'inbound' | 'outbound' | 'intertheater';
  origin_port_id?: string;
  origin_region_id?: string;
  destination_port_id?: string;
  destination_region_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined data from Supabase query
  origin_port?: {
    id: string;
    name: string;
    code: string;
  };
  destination_port?: {
    id: string;
    name: string;
    code: string;
  };
  origin_region?: {
    id: string;
    name: string;
  };
  destination_region?: {
    id: string;
    name: string;
  };
}

export interface CustomConsolidationGroup {
  poe_id: string;
  poe_name: string;
  poe_code: string;
  pod_id: string;
  pod_name: string;
  pod_code: string;
  shipment_count: number;
  total_cube: number;
  has_user_shipments: boolean;
  is_custom: true;
  custom_type: 'port_to_region' | 'region_to_port' | 'region_to_region' | 'port_to_port';
  origin_region_id?: string;
  origin_region_name?: string;
  destination_region_id?: string;
  destination_region_name?: string;
  combined_from: any[];
  combined_cards_count?: number; // Add this property to track how many cards were combined
  shipment_details: any[];
  custom_id: string;
  db_id?: string;
}
