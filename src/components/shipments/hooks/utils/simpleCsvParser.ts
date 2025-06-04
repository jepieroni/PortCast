
import { BulkUploadRecord } from './bulkUploadTypes';

export const parseCSV = (csvText: string): BulkUploadRecord[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('File must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Check for required columns
  const requiredColumns = [
    'gbl_number', 'shipper_last_name', 'shipment_type', 
    'origin_rate_area', 'destination_rate_area', 'pickup_date', 
    'rdd', 'poe_code', 'pod_code', 'scac_code'
  ];

  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const records: BulkUploadRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    const record: BulkUploadRecord = {
      id: `temp_${i}`,
      gbl_number: getValue(values, headers, 'gbl_number'),
      shipper_last_name: getValue(values, headers, 'shipper_last_name'),
      shipment_type: getValue(values, headers, 'shipment_type'),
      origin_rate_area: getValue(values, headers, 'origin_rate_area'),
      destination_rate_area: getValue(values, headers, 'destination_rate_area'),
      pickup_date: getValue(values, headers, 'pickup_date'),
      rdd: getValue(values, headers, 'rdd'),
      poe_code: getValue(values, headers, 'poe_code'),
      pod_code: getValue(values, headers, 'pod_code'),
      scac_code: getValue(values, headers, 'scac_code'),
      estimated_cube: getValue(values, headers, 'estimated_cube'),
      actual_cube: getValue(values, headers, 'actual_cube'),
      status: 'pending',
      errors: []
    };

    records.push(record);
  }

  return records;
};

const getValue = (values: string[], headers: string[], columnName: string): string => {
  const index = headers.indexOf(columnName);
  return index >= 0 && index < values.length ? values[index] : '';
};
