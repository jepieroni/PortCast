
export interface RateArea {
  id: string;
  rate_area: string;
  name: string | null;
  country_id: string;
  is_conus: boolean;
  is_intertheater_only: boolean;
  countries: {
    name: string;
  };
}

export interface TSP {
  id: string;
  name: string;
  scac_code: string;
}

export interface Port {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  rate_area_id?: string | null;
  created_at?: string | null;
}

export interface PortRegion {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface PortRegionMembership {
  id: string;
  port_id: string;
  region_id: string;
  created_at: string;
}

export interface ShipmentFormData {
  gblNumber: string;
  shipperLastName: string;
  pickupDate: Date | undefined;
  rdd: Date | undefined;
  shipmentType: string;
  originRateArea: string;
  destinationRateArea: string;
  targetPoeId: string;
  targetPodId: string;
  tspId: string;
  estimatedCube: string;
  actualCube: string;
}
