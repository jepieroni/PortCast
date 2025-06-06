
import { useState } from 'react';
import { processUploadedFile } from './utils/fileProcessor';
import { createStagingRecords } from './utils/stagingRecordCreator';
import { processAndValidateRecords } from './utils/validationProcessor';

export const useBulkFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      console.log('🚀 BULK FILE UPLOAD: Starting file upload process for:', file.name);
      
      // Process the uploaded file to extract records
      const records = await processUploadedFile(file);
      console.log(`🚀 BULK FILE UPLOAD: Extracted ${records.length} records from file`);
      
      // Create staging records and get upload session ID
      const uploadSessionId = await createStagingRecords(records);
      console.log(`🚀 BULK FILE UPLOAD: Created staging records with session ID: ${uploadSessionId}`);
      
      // Validate all staging records
      const { records: validatedRecords, summary } = await processAndValidateRecords(uploadSessionId);
      console.log(`🚀 BULK FILE UPLOAD: Validation complete:`, summary);
      
      return {
        uploadSessionId,
        records: validatedRecords,
        summary
      };
      
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
