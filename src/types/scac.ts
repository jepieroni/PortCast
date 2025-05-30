
export interface TSP {
  id: string;
  scac_code: string;
  name: string;
  organization_id: string | null;
  organization_name?: string;
}

export interface ScacClaim {
  id: string;
  organization_id: string;
  organization_name: string;
  requested_by: string;
  requester_name: string;
  tsp_ids: string[];
  tsp_details: {
    id: string;
    scac_code: string;
    name: string;
    organization_id: string | null;
  }[];
  status: string;
  requested_at: string;
  approval_token: string;
}
