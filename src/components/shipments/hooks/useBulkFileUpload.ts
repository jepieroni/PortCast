
import { useState } from 'react';
import { processUploadedFile } from './utils/fileProcessor';
import { createStagingRecords } from './utils/stagingRecordCreator';
import { processAndValidateRecords } from './utils/validationProcessor';
import { supabase } from '@/integrations/supabase/client';

export const useBulkFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File, onSuccess?: (result: any) => void) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      console.log('🚀 BULK FILE UPLOAD: Starting file upload process for:', file.name);
      
      // Get current user info
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error('User organization not found');
      }

      console.log('🚀 BULK FILE UPLOAD: User info:', {
        userId: user.id,
        organizationId: profile.organization_id
      });
      
      // Process the uploaded file to extract records
      const records = await processUploadedFile(file);
      console.log(`🚀 BULK FILE UPLOAD: Extracted ${records.length} records from file`);
      
      // Create staging records and get upload session ID
      const uploadSessionId = await createStagingRecords(records, profile.organization_id, user.id);
      console.log(`🚀 BULK FILE UPLOAD: Created staging records with session ID: ${uploadSessionId}`);
      
      // Validate all staging records
      const { records: validatedRecords, summary } = await processAndValidateRecords(uploadSessionId);
      console.log(`🚀 BULK FILE UPLOAD: Validation complete:`, summary);
      
      const result = {
        uploadSessionId,
        records: validatedRecords,
        summary
      };

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
      
    } catch (error: any) {
      console.error('🚀 BULK FILE UPLOAD: Upload error:', error);
      setUploadError(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploadError = () => {
    setUploadError(null);
  };

  return {
    isUploading,
    uploadError,
    uploadFile,
    clearUploadError
  };
};
