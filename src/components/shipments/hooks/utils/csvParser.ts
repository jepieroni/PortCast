import { parseDateString } from '../../../shipment-registration/components/hooks/utils/dateParser';

export interface ParsedRow {
  [key: string]: any;
  _validation_errors: string[];
  parsed_pickup_date: string | null;
  parsed_rdd: string | null;
  parsed_estimated_cube: number | null;
  parsed_actual_cube: number | null;
}

export const parseCSV = (csvText: string): ParsedRow[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('File must contain at least a header row and one data row');

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const requiredColumns = [
    'gbl_number', 'shipper_last_name', 'shipment_type', 
    'origin_rate_area', 'destination_rate_area', 'pickup_date', 
    'rdd', 'poe_code', 'pod_code', 'scac_code'
  ];

  // Validate required columns exist
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const data: ParsedRow[] = [];
  const duplicateGBLsInFile = new Set();
  const fileGBLs = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    // Handle lines with fewer values than headers by padding with empty strings
    while (values.length < headers.length) {
      values.push('');
    }

    const row: ParsedRow = {
      _validation_errors: [],
      parsed_pickup_date: null,
      parsed_rdd: null,
      parsed_estimated_cube: null,
      parsed_actual_cube: null
    };
    
    headers.forEach((header, index) => {
      // Safely access the value and ensure it's a string
      const rawValue = values[index];
      let value = '';
      
      if (rawValue !== undefined && rawValue !== null) {
        value = String(rawValue);
      }
      
      row[header] = value;
    });

    console.log(`Processing row ${i}: GBL=${row.gbl_number}`);

    // Check for duplicate GBLs within the file
    if (row.gbl_number && typeof row.gbl_number === 'string' && row.gbl_number.trim() !== '') {
      if (fileGBLs.has(row.gbl_number)) {
        duplicateGBLsInFile.add(row.gbl_number);
        row._validation_errors.push(`Duplicate GBL number found in file: ${row.gbl_number}`);
      } else {
        fileGBLs.add(row.gbl_number);
      }
    }

    data.push(row);
  }

  // Log duplicate GBLs found in file
  if (duplicateGBLsInFile.size > 0) {
    console.log(`Found ${duplicateGBLsInFile.size} duplicate GBL(s) within the uploaded file:`, Array.from(duplicateGBLsInFile));
  }

  console.log(`Parsed ${data.length} records from CSV`);
  return data;
};
