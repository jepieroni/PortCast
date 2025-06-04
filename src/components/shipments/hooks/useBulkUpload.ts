
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseDateString } from '../components/hooks/utils/dateParser';

export const useBulkUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cleanupOldStagingRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Cleaning up old staging records for user:', user.id);
      
      const { error } = await supabase
        .from('shipment_uploads_staging')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error cleaning up staging records:', error);
      } else {
        console.log('Old staging records cleaned up successfully');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const mapShipmentType = (type: string): { mappedType: string; isValid: boolean } => {
    if (!type || typeof type !== 'string' || type.trim() === '') {
      return { mappedType: '', isValid: false };
    }
    
    const cleanType = type.trim();
    const typeMap: { [key: string]: string } = {
      'I': 'inbound',
      'O': 'outbound', 
      'T': 'intertheater',
      'i': 'inbound',
      'o': 'outbound',
      't': 'intertheater',
      'inbound': 'inbound',
      'outbound': 'outbound',
      'intertheater': 'intertheater'
    };
    
    const mappedType = typeMap[cleanType];
    return {
      mappedType: mappedType || '',
      isValid: !!mappedType
    };
  };

  const parseAndValidateDate = (dateStr: string, fieldName: string): { parsedDate: string | null; error: string | null } => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
      return { parsedDate: null, error: `${fieldName} is required` };
    }

    // Try to parse the date
    const parsed = parseDateString(dateStr.trim());
    if (!parsed) {
      return { parsedDate: null, error: `Invalid ${fieldName} format. Use MM/DD/YY or MM/DD/YYYY` };
    }

    // Check if pickup date is too old (more than 30 days ago)
    if (fieldName.toLowerCase().includes('pickup')) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      if (parsed < thirtyDaysAgo) {
        return { 
          parsedDate: parsed.toISOString().split('T')[0], 
          error: `Pickup date is more than 30 days in the past (${parsed.toLocaleDateString()})` 
        };
      }
    }

    return { parsedDate: parsed.toISOString().split('T')[0], error: null };
  };

  const parseAndValidateCube = (cubeStr: string, fieldName: string): { parsedCube: number | null; error: string | null } => {
    if (!cubeStr || typeof cubeStr !== 'string' || cubeStr.trim() === '') {
      return { parsedCube: null, error: null };
    }

    const numValue = parseInt(cubeStr.trim());
    if (isNaN(numValue) || numValue < 0) {
      return { parsedCube: null, error: `Invalid ${fieldName} - must be a positive number` };
    }

    return { parsedCube: numValue, error: null };
  };

  const validateCubeLogic = (estimatedCube: number | null, actualCube: number | null, pickupDate: Date | null): string[] => {
    const errors: string[] = [];
    const hasEstimated = estimatedCube !== null && estimatedCube > 0;
    const hasActual = actualCube !== null && actualCube > 0;
    const isPickupInPast = pickupDate && pickupDate <= new Date();

    // Both estimated and actual provided
    if (hasEstimated && hasActual) {
      errors.push('Cannot have both estimated and actual cube - choose one based on pickup date');
      return errors;
    }

    // Neither estimated nor actual provided
    if (!hasEstimated && !hasActual) {
      if (isPickupInPast) {
        errors.push('Actual cube is required when pickup date is today or in the past');
      } else {
        errors.push('Estimated cube is required when pickup date is in the future');
      }
      return errors;
    }

    // Actual cube with future pickup date
    if (hasActual && !isPickupInPast) {
      errors.push('Cannot have actual cube when pickup date is in the future - use estimated cube instead');
    }

    // Estimated cube with past pickup date
    if (hasEstimated && isPickupInPast) {
      errors.push('Should use actual cube when pickup date is today or in the past');
    }

    return errors;
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    // For Excel files, we'll need to convert them to CSV format first
    // This is a simplified approach - in a real app you'd use a library like xlsx
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // For now, we'll reject Excel files and ask for CSV conversion
          // In production, you'd use a library like SheetJS/xlsx to parse Excel
          reject(new Error('Excel file parsing not yet implemented. Please convert to CSV format.'));
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSV = (csvText: string) => {
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

    const data = [];
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

      const row: any = {};
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

      // Track validation errors for this row
      row._validation_errors = [];

      // Validate GBL number
      if (!row.gbl_number || (typeof row.gbl_number === 'string' && row.gbl_number.trim() === '')) {
        row._validation_errors.push('GBL number is required');
      } else {
        // Check for duplicate GBLs within the file
        if (fileGBLs.has(row.gbl_number)) {
          duplicateGBLsInFile.add(row.gbl_number);
          row._validation_errors.push(`Duplicate GBL number found in file: ${row.gbl_number}`);
        } else {
          fileGBLs.add(row.gbl_number);
        }
      }

      // Validate shipper last name
      if (!row.shipper_last_name || (typeof row.shipper_last_name === 'string' && row.shipper_last_name.trim() === '')) {
        row._validation_errors.push('Shipper last name is required');
      }

      // Validate and map shipment type
      const shipmentTypeResult = mapShipmentType(row.shipment_type || '');
      if (!shipmentTypeResult.isValid) {
        row._validation_errors.push('Invalid or missing shipment type. Use I/O/T or inbound/outbound/intertheater');
        row.shipment_type = ''; // Clear invalid type
      } else {
        row.shipment_type = shipmentTypeResult.mappedType;
      }

      // Validate required text fields
      const requiredTextFields = [
        { field: 'origin_rate_area', name: 'Origin rate area' },
        { field: 'destination_rate_area', name: 'Destination rate area' },
        { field: 'poe_code', name: 'POE code' },
        { field: 'pod_code', name: 'POD code' },
        { field: 'scac_code', name: 'SCAC code' }
      ];

      requiredTextFields.forEach(({ field, name }) => {
        if (!row[field] || (typeof row[field] === 'string' && row[field].trim() === '')) {
          row._validation_errors.push(`${name} is required`);
        }
      });

      // Validate dates
      const pickupResult = parseAndValidateDate(row.pickup_date || '', 'Pickup date');
      const rddResult = parseAndValidateDate(row.rdd || '', 'Required delivery date');

      if (pickupResult.error) {
        row._validation_errors.push(pickupResult.error);
      }
      if (rddResult.error) {
        row._validation_errors.push(rddResult.error);
      }

      // Store parsed dates (or null if invalid)
      row.parsed_pickup_date = pickupResult.parsedDate;
      row.parsed_rdd = rddResult.parsedDate;

      // Validate cube fields
      const estimatedResult = parseAndValidateCube(row.estimated_cube || '', 'estimated cube');
      const actualResult = parseAndValidateCube(row.actual_cube || '', 'actual cube');

      if (estimatedResult.error) {
        row._validation_errors.push(estimatedResult.error);
      }
      if (actualResult.error) {
        row._validation_errors.push(actualResult.error);
      }

      // Store parsed cube values
      row.parsed_estimated_cube = estimatedResult.parsedCube;
      row.parsed_actual_cube = actualResult.parsedCube;

      // Validate cube logic only if we have a valid pickup date
      if (pickupResult.parsedDate) {
        const pickupDate = new Date(pickupResult.parsedDate);
        const cubeErrors = validateCubeLogic(estimatedResult.parsedCube, actualResult.parsedCube, pickupDate);
        row._validation_errors.push(...cubeErrors);
      }

      console.log(`Row ${i} validation errors:`, row._validation_errors);
      data.push(row);
    }

    // Log duplicate GBLs found in file
    if (duplicateGBLsInFile.size > 0) {
      console.log(`Found ${duplicateGBLsInFile.size} duplicate GBL(s) within the uploaded file:`, Array.from(duplicateGBLsInFile));
    }

    console.log(`Parsed ${data.length} records from CSV`);
    return data;
  };

  const checkForDuplicateGBLs = async (parsedData: any[]) => {
    const gblNumbers = parsedData.map(row => row.gbl_number).filter(gbl => gbl && typeof gbl === 'string' && gbl.trim() !== '');
    
    if (gblNumbers.length === 0) return parsedData;

    // Check for existing GBLs in the shipments table
    const { data: existingShipments, error } = await supabase
      .from('shipments')
      .select('gbl_number')
      .in('gbl_number', gblNumbers);

    if (error) {
      console.error('Error checking for duplicate GBLs:', error);
      throw error;
    }

    const existingGBLs = new Set(existingShipments?.map(s => s.gbl_number) || []);
    
    // Mark records with existing GBLs in database but don't filter them out
    const dataWithDuplicateFlags = parsedData.map(row => {
      if (row.gbl_number && existingGBLs.has(row.gbl_number)) {
        console.log(`Found existing GBL in database: ${row.gbl_number}`);
        row._validation_errors = row._validation_errors || [];
        row._validation_errors.push(`GBL number already exists in database: ${row.gbl_number}`);
      }
      return row;
    });

    return dataWithDuplicateFlags;
  };

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Clean up old staging records first
      await cleanupOldStagingRecords();

      let parsedData;

      // Handle different file types
      if (file.name.toLowerCase().endsWith('.csv')) {
        const csvText = await file.text();
        parsedData = parseCSV(csvText);
      } else if (file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')) {
        // For now, we'll show an error for Excel files
        throw new Error('Excel file support coming soon. Please convert your file to CSV format and try again.');
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      // Check for duplicate GBLs in database and flag them
      parsedData = await checkForDuplicateGBLs(parsedData);

      if (parsedData.length === 0) {
        throw new Error('No valid records found in file');
      }

      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('User organization not found');

      // Generate upload session ID
      const uploadSessionId = crypto.randomUUID();

      console.log('Starting new upload session:', uploadSessionId);

      // Process and insert staging data (including records with validation errors)
      const stagingRecords = parsedData.map(row => {
        return {
          upload_session_id: uploadSessionId,
          organization_id: profile.organization_id,
          user_id: user.id,
          gbl_number: row.gbl_number || '',
          shipper_last_name: row.shipper_last_name || '',
          shipment_type: row.shipment_type || '',
          origin_rate_area: '',  // Will be populated during validation
          destination_rate_area: '', // Will be populated during validation
          pickup_date: row.parsed_pickup_date, // Use parsed date or null
          rdd: row.parsed_rdd, // Use parsed date or null
          estimated_cube: row.parsed_estimated_cube,
          actual_cube: row.parsed_actual_cube,
          remaining_cube: null, // We don't care about this during import
          raw_poe_code: row.poe_code || '',
          raw_pod_code: row.pod_code || '',
          raw_origin_rate_area: row.origin_rate_area || '',
          raw_destination_rate_area: row.destination_rate_area || '',
          raw_scac_code: row.scac_code || '',
          validation_status: row._validation_errors && row._validation_errors.length > 0 ? 'invalid' : 'pending',
          validation_errors: row._validation_errors || []
        };
      });

      console.log(`Inserting ${stagingRecords.length} staging records`);

      const { error } = await supabase
        .from('shipment_uploads_staging')
        .insert(stagingRecords);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Upload completed successfully with session:', uploadSessionId);
      return uploadSessionId;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload file';
      setUploadError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadError
  };
};
