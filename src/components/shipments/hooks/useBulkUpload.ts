
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const mapShipmentType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'I': 'inbound',
      'O': 'outbound', 
      'T': 'intertheater',
      'i': 'inbound',
      'o': 'outbound',
      't': 'intertheater'
    };
    return typeMap[type] || type;
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
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Check for duplicate GBLs within the file
      if (row.gbl_number) {
        if (fileGBLs.has(row.gbl_number)) {
          duplicateGBLsInFile.add(row.gbl_number);
          row._validation_errors = row._validation_errors || [];
          row._validation_errors.push(`Duplicate GBL number found in file: ${row.gbl_number}`);
        } else {
          fileGBLs.add(row.gbl_number);
        }
      }

      // Map shipment type
      if (row.shipment_type) {
        row.shipment_type = mapShipmentType(row.shipment_type);
      }

      // Handle cube logic: if actual_cube is present but remaining_cube is not, copy actual_cube to remaining_cube
      if (row.actual_cube && !row.remaining_cube) {
        row.remaining_cube = row.actual_cube;
      }

      // Only validate truly required fields (don't reject for blank optional fields)
      const criticalRequiredFields = ['gbl_number', 'shipper_last_name', 'shipment_type', 'pickup_date', 'rdd'];
      const missingCriticalFields = criticalRequiredFields.filter(col => !row[col] || row[col].trim() === '');
      
      if (missingCriticalFields.length > 0) {
        row._validation_errors = row._validation_errors || [];
        row._validation_errors.push(`Missing critical required fields: ${missingCriticalFields.join(', ')}`);
      }

      data.push(row);
    }

    // Log duplicate GBLs found in file
    if (duplicateGBLsInFile.size > 0) {
      console.log(`Found ${duplicateGBLsInFile.size} duplicate GBL(s) within the uploaded file:`, Array.from(duplicateGBLsInFile));
    }

    return data;
  };

  const checkForDuplicateGBLs = async (parsedData: any[]) => {
    const gblNumbers = parsedData.map(row => row.gbl_number).filter(Boolean);
    
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
      if (existingGBLs.has(row.gbl_number)) {
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
      const stagingRecords = parsedData.map(row => ({
        upload_session_id: uploadSessionId,
        organization_id: profile.organization_id,
        user_id: user.id,
        gbl_number: row.gbl_number || '',
        shipper_last_name: row.shipper_last_name || '',
        shipment_type: row.shipment_type || 'inbound',
        origin_rate_area: '',  // Will be populated during validation
        destination_rate_area: '', // Will be populated during validation
        pickup_date: row.pickup_date || '1900-01-01',
        rdd: row.rdd || '1900-01-01',
        estimated_cube: row.estimated_cube ? parseInt(row.estimated_cube) : null,
        actual_cube: row.actual_cube ? parseInt(row.actual_cube) : null,
        remaining_cube: row.remaining_cube ? parseInt(row.remaining_cube) : null,
        raw_poe_code: row.poe_code || '',
        raw_pod_code: row.pod_code || '',
        raw_origin_rate_area: row.origin_rate_area || '',
        raw_destination_rate_area: row.destination_rate_area || '',
        raw_scac_code: row.scac_code || '',
        validation_status: row._validation_errors ? 'invalid' : 'pending',
        validation_errors: row._validation_errors || []
      }));

      const { error } = await supabase
        .from('shipment_uploads_staging')
        .insert(stagingRecords);

      if (error) throw error;

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
