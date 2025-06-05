
import { useState } from 'react';
import { BulkUploadRecord, BulkUploadState } from './utils/bulkUploadTypes';
import { useStagingRecords } from './useStagingRecords';
import { useFileUpload } from './useFileUpload';
import { useRecordProcessing } from './useRecordProcessing';

export const useBulkUploadNew = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bulkState, setBulkState] = useState<BulkUploadState | null>(null);

  const {
    hasStagingRecords,
    isCheckingStagingRecords,
    checkForStagingRecords,
    loadStagingRecords: loadStagingRecordsFromHook,
    updateStagingRecord,
    cleanupStagingRecords,
    clearStagingState
  } = useStagingRecords();

  const { uploadFile: uploadFileFromHook } = useFileUpload();
  const { updateRecord: updateRecordFromHook, processValidRecords: processValidRecordsFromHook } = useRecordProcessing();

  const loadStagingRecords = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const validatedRecords = await loadStagingRecordsFromHook();
      
      if (validatedRecords.length === 0) {
        return;
      }

      // Calculate summary
      const summary = {
        total: validatedRecords.length,
        valid: validatedRecords.filter(r => r.status === 'valid').length,
        invalid: validatedRecords.filter(r => r.status === 'invalid').length,
        pending: 0
      };

      setBulkState({
        records: validatedRecords,
        summary
      });

      console.log('Staging records loaded and validated:', summary);

    } catch (error: any) {
      console.error('Error loading staging records:', error);
      setUploadError(error.message || 'Failed to load staging records');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFileFromHook(file);
      setBulkState(result);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const updateRecord = async (recordId: string, updates: Partial<BulkUploadRecord>) => {
    if (!bulkState) return;

    try {
      // Update the staging record first
      await updateStagingRecord(recordId, updates);

      // Then update the in-memory records
      const updatedRecords = await updateRecordFromHook(bulkState.records, recordId, updates);

      const summary = {
        total: updatedRecords.length,
        valid: updatedRecords.filter(r => r.status === 'valid').length,
        invalid: updatedRecords.filter(r => r.status === 'invalid').length,
        pending: 0
      };

      setBulkState({
        records: updatedRecords,
        summary
      });
    } catch (error: any) {
      console.error('Error updating record:', error);
      setUploadError(error.message || 'Failed to update record');
    }
  };

  const processValidRecords = async () => {
    if (!bulkState) return;

    setIsUploading(true);
    try {
      const validRecords = await processValidRecordsFromHook(bulkState.records);
      
      if (validRecords) {
        // Clean up staging records for processed shipments
        const recordIds = validRecords.map(r => r.id);
        await cleanupStagingRecords(recordIds);

        setBulkState(null);
        clearStagingState();
      }
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    updateRecord,
    processValidRecords,
    loadStagingRecords,
    checkForStagingRecords,
    isUploading,
    uploadError,
    bulkState,
    hasStagingRecords,
    isCheckingStagingRecords,
    clearState: () => {
      setBulkState(null);
      clearStagingState();
    }
  };
};
