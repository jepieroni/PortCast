
import { BulkUploadRecord } from './bulkUploadTypes';

export const parseCSV = (csvText: string): BulkUploadRecord[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  console.log('CSV Headers found:', headers);

  // Create field mapping
  const fieldMap: { [key: string]: string } = {};
  headers.forEach((header, index) => {
    // Map various header formats to our standard field names
    const cleanHeader = header.replace(/['"]/g, '').trim();
    
    if (cleanHeader.includes('gbl') || cleanHeader.includes('number')) {
      fieldMap.gbl_number = header;
    } else if (cleanHeader.includes('shipper') && cleanHeader.includes('name')) {
      fieldMap.shipper_last_name = header;
    } else if (cleanHeader.includes('shipment') && cleanHeader.includes('type')) {
      fieldMap.shipment_type = header;
    } else if (cleanHeader.includes('origin') && cleanHeader.includes('rate')) {
      fieldMap.origin_rate_area = header;
    } else if (cleanHeader.includes('destination') && cleanHeader.includes('rate')) {
      fieldMap.destination_rate_area = header;
    } else if (cleanHeader.includes('pickup') && cleanHeader.includes('date')) {
      fieldMap.pickup_date = header;
    } else if (cleanHeader.includes('rdd') || (cleanHeader.includes('delivery') && cleanHeader.includes('date'))) {
      fieldMap.rdd = header;
    } else if (cleanHeader.includes('poe')) {
      fieldMap.poe_code = header;
    } else if (cleanHeader.includes('pod')) {
      fieldMap.pod_code = header;
    } else if (cleanHeader.includes('scac')) {
      fieldMap.scac_code = header;
    } else if (cleanHeader.includes('estimated') && cleanHeader.includes('cube')) {
      fieldMap.estimated_cube = header;
    } else if (cleanHeader.includes('actual') && cleanHeader.includes('cube')) {
      fieldMap.actual_cube = header;
    }
  });

  console.log('Field mapping:', fieldMap);

  // Parse data rows
  const records: BulkUploadRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}, skipping`);
      continue;
    }

    // Create record object
    const record: BulkUploadRecord = {
      id: `row-${i}`,
      gbl_number: getFieldValue(values, headers, fieldMap.gbl_number) || '',
      shipper_last_name: getFieldValue(values, headers, fieldMap.shipper_last_name) || '',
      shipment_type: getFieldValue(values, headers, fieldMap.shipment_type) || '',
      origin_rate_area: getFieldValue(values, headers, fieldMap.origin_rate_area) || '',
      destination_rate_area: getFieldValue(values, headers, fieldMap.destination_rate_area) || '',
      pickup_date: getFieldValue(values, headers, fieldMap.pickup_date) || '',
      rdd: getFieldValue(values, headers, fieldMap.rdd) || '',
      poe_code: getFieldValue(values, headers, fieldMap.poe_code) || '',
      pod_code: getFieldValue(values, headers, fieldMap.pod_code) || '',
      scac_code: getFieldValue(values, headers, fieldMap.scac_code) || '',
      estimated_cube: getFieldValue(values, headers, fieldMap.estimated_cube),
      actual_cube: getFieldValue(values, headers, fieldMap.actual_cube),
      status: 'pending',
      errors: []
    };

    records.push(record);
  }

  console.log(`Parsed ${records.length} records from CSV`);
  return records;
};

const getFieldValue = (values: string[], headers: string[], headerName?: string): string | undefined => {
  if (!headerName) return undefined;
  
  const index = headers.indexOf(headerName);
  if (index === -1) return undefined;
  
  const value = values[index]?.trim();
  return value === '' ? undefined : value;
};
