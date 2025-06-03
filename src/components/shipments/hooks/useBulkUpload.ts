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

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must contain at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredColumns = [
      'gbl_number', 'shipper_last_name', 'shipment_type', 
      'origin_rate_area', 'destination_rate_area', 'pickup_date', 
      'rdd', 'poe_code', 'pod_code', 'scac_code'
    ];

    // Validate required columns
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate required fields
      const missingFields = requiredColumns.filter(col => !row[col] || row[col].trim() === '');
      if (missingFields.length > 0) {
        row._validation_errors = [`Missing required fields: ${missingFields.join(', ')}`];
      }

      data.push(row);
    }

    return data;
  };

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Clean up old staging records first
      await cleanupOldStagingRecords();

      // Read and parse CSV
      const csvText = await file.text();
      const parsedData = parseCSV(csvText);

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

      // Process and insert staging data
      const stagingRecords = parsedData.map(row => ({
        upload_session_id: uploadSessionId,
        organization_id: profile.organization_id,
        user_id: user.id,
        gbl_number: row.gbl_number,
        shipper_last_name: row.shipper_last_name,
        shipment_type: row.shipment_type,
        origin_rate_area: row.origin_rate_area, // This will be resolved later
        destination_rate_area: row.destination_rate_area, // This will be resolved later
        pickup_date: row.pickup_date,
        rdd: row.rdd,
        estimated_cube: row.estimated_cube ? parseInt(row.estimated_cube) : null,
        actual_cube: row.actual_cube ? parseInt(row.actual_cube) : null,
        remaining_cube: row.remaining_cube ? parseInt(row.remaining_cube) : null,
        raw_poe_code: row.poe_code,
        raw_pod_code: row.pod_code,
        raw_origin_rate_area: row.origin_rate_area,
        raw_destination_rate_area: row.destination_rate_area,
        raw_scac_code: row.scac_code,
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
