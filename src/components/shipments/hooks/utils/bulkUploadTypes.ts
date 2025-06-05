
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
  status: 'valid' | 'invalid' | 'pending';
  errors: string[];
  warnings?: string[];
  
  // Resolved IDs
  target_poe_id?: string;
  target_pod_id?: string;
  tsp_id?: string;
  
  // Database fields that SimplifiedReviewTable expects
  validation_status?: string;
  validation_errors?: any[];
  validation_warnings?: any[];
}

export interface BulkUploadResult {
  success: boolean;
  message: string;
  validRecords: number;
  invalidRecords: number;
  records?: BulkUploadRecord[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
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
