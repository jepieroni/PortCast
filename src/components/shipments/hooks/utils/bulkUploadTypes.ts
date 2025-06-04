
export interface BulkUploadRecord {
  id: string;
  gbl_number: string;
  shipper_last_name: string;
  shipment_type: string;
  origin_rate_area: string;
  destination_rate_area: string;
  pickup_date: string;
  rdd: string;
  poe_code: string;
  pod_code: string;
  scac_code: string;
  estimated_cube?: string;
  actual_cube?: string;
  
  // Validation state
  status: 'pending' | 'valid' | 'invalid';
  errors: string[];
  
  // Translated values (populated during processing)
  target_poe_id?: string;
  target_pod_id?: string;
  tsp_id?: string;
}

export interface BulkUploadState {
  records: BulkUploadRecord[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    pending: number;
  };
}
