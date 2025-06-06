
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BulkUploadRecord } from './utils/bulkUploadTypes';
import { useStagingRecords } from './useStagingRecords';
import { useShipmentProcessing } from './useShipmentProcessing';
import { useBulkUploadState } from './useBulkUploadState';
import { useBulkRecordOperations } from './useBulkRecordOperations';
import { useBulkFileUpload } from './useBulkFileUpload';

export const useBulkUploadNew = () => {
  const { toast } = useToast();
  const {
    hasStagingRecords,
    isCheckingStagingRecords,
    checkForStagingRecords,
    loadStagingRecords,
    updateStagingRecord,
    cleanupStagingRecords,
    clearStagingState
  } = useStagingRecords();

  const {
    records,
    setRecords,
    summary,
    setSummary,
    uploadSessionId,
    setUploadSessionId,
    bulkState,
    updateSummary,
    clearState: clearUploadState
  } = useBulkUploadState();

  const { isProcessing, processValidShipments } = useShipmentProcessing(uploadSessionId);
  
  const { isUploading, uploadError, uploadFile, clearUploadError } = useBulkFileUpload();

  const { updateRecord } = useBulkRecordOperations({
    records,
    setRecords,
    updateSummary,
    updateStagingRecord
  });

  const loadExistingRecords = useCallback(async () => {
    try {
      console.log('Loading staging records...');
      const stagingRecords = await loadStagingRecords();
      console.log('Loading staging records:', stagingRecords.length);

      if (stagingRecords.length > 0) {
        setRecords(stagingRecords);
        
        // Calculate summary from loaded records
        const newSummary = {
          total: stagingRecords.length,
          valid: stagingRecords.filter(r => r.status === 'valid').length,
          invalid: stagingRecords.filter(r => r.status === 'invalid').length,
          warning: stagingRecords.filter(r => r.status === 'warning').length,
          pending: stagingRecords.filter(r => r.status === 'pending').length
        };
        
        setSummary(newSummary);
        console.log('Staging records loaded and validated:', newSummary);
        
        return stagingRecords;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error loading existing records:', error);
      toast({
        title: "Error",
        description: "Failed to load existing records: " + error.message,
        variant: "destructive"
      });
      return [];
    }
  }, [loadStagingRecords, toast, setRecords, setSummary]);

  const processRecords = async () => {
    try {
      // Get the latest staging data for processing
      const stagingRecords = await loadStagingRecords();
      await processValidShipments(stagingRecords);
      
      // Clear local state after successful processing
      clearUploadState();
      clearStagingState();
      
      toast({
        title: "Success",
        description: "Shipments processed successfully!",
      });
    } catch (error: any) {
      console.error('Error processing records:', error);
      toast({
        title: "Error",
        description: "Failed to process shipments: " + error.message,
        variant: "destructive"
      });
    }
  };

  const processValidRecords = async () => {
    await processRecords();
  };

  const clearState = () => {
    clearUploadState();
    clearUploadError();
    clearStagingState();
  };

  return {
    // State
    records,
    summary,
    uploadSessionId,
    hasStagingRecords,
    isCheckingStagingRecords,
    isProcessing: isProcessing || isUploading,
    isUploading,
    uploadError,
    bulkState,
    
    // Actions
    checkForStagingRecords,
    loadExistingRecords,
    loadStagingRecords: loadExistingRecords, // Alias for compatibility
    updateRecord,
    processRecords,
    processValidRecords,
    uploadFile,
    setUploadSessionId,
    clearStagingState,
    clearState
  };
};
