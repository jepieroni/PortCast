
export type BulkUploadStatus = 'pending' | 'valid' | 'invalid' | 'warning';

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
  estimated_cube: string;
  actual_cube: string;
  status: BulkUploadStatus;
  errors: string[];
  warnings?: string[];
  approved_warnings?: string[]; // Add approved warnings field
  target_poe_id?: string;
  target_pod_id?: string;
  tsp_id?: string;
  validation_status?: string;
  validation_errors?: string[];
  validation_warnings?: string[];
}

export interface BulkUploadSummary {
  total: number;
  valid: number;
  invalid: number;
  warning: number;
  pending: number;
}
