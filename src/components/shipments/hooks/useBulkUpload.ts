
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseCSV } from './utils/csvParser';
import { validateRow } from './utils/rowValidation';
import { checkForDuplicateGBLs } from './utils/duplicateChecker';
import { mapToStagingRecord } from './utils/stagingRecordMapper';

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

      // Validate each row
      parsedData = parsedData.map(validateRow);

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
      const stagingRecords = parsedData.map(row => 
        mapToStagingRecord(row, uploadSessionId, profile.organization_id, user.id)
      );

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
