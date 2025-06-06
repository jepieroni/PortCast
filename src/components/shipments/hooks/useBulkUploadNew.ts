
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BulkUploadRecord } from './utils/bulkUploadTypes';
import { useStagingRecords } from './useStagingRecords';
import { useShipmentProcessing } from './useShipmentProcessing';
import { validateRecordComplete } from './utils/simpleValidator';

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

  const [records, setRecords] = useState<BulkUploadRecord[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    warning: 0,
    pending: 0
  });
  const [uploadSessionId, setUploadSessionId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { isProcessing, processValidShipments } = useShipmentProcessing(uploadSessionId);

  // Create bulkState object for compatibility with BulkShipmentUpload
  const bulkState = records.length > 0 ? { records, summary } : null;

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
  }, [loadStagingRecords, toast]);

  const updateRecord = useCallback(async (recordId: string, updates: Partial<BulkUploadRecord>) => {
    console.log(`Updating record ${recordId} with:`, updates);
    
    try {
      // Update the staging record in the database
      await updateStagingRecord(recordId, updates);
      
      // Update the local records state
      setRecords(prevRecords => {
        const updatedRecords = prevRecords.map(record => {
          if (record.id === recordId) {
            const updatedRecord = { ...record, ...updates };
            console.log(`Updated record ${recordId}:`, {
              original_shipment_type: record.shipment_type,
              updated_shipment_type: updatedRecord.shipment_type,
              original_pickup_date: record.pickup_date,
              updated_pickup_date: updatedRecord.pickup_date,
              cleared_warnings: updatedRecord.approved_warnings?.length > 0 ? 'YES' : 'NO',
              approved_warnings_count: updatedRecord.approved_warnings?.length || 0,
              status_before: record.status,
              status_after: updatedRecord.status
            });
            
            // CRITICAL FIX: Don't re-validate if we're just updating approved warnings
            // The staging updater already handles re-validation with approved warnings
            if (updates.approved_warnings && !updates.gbl_number && !updates.pickup_date) {
              console.log('🔥 BULK UPLOAD NEW: Skipping re-validation - approved warnings update only');
              return updatedRecord;
            }
            
            // Only re-validate if actual field data changed (not just approved warnings)
            const hasFieldChanges = Object.keys(updates).some(key => 
              key !== 'approved_warnings' && key !== 'status' && key !== 'errors' && key !== 'warnings'
            );
            
            if (hasFieldChanges) {
              console.log('🔥 BULK UPLOAD NEW: Re-validating due to field changes');
              // Re-validate with the current approved warnings including what was passed in updates
              const approvedWarningsForValidation = updates.approved_warnings || updatedRecord.approved_warnings || [];
              
              validateRecordComplete(updatedRecord, approvedWarningsForValidation).then(validationResult => {
                console.log(`Complete validation result for record ${recordId}:`, validationResult);
                
                let newStatus: string;
                if (validationResult.errors.length > 0) {
                  newStatus = 'invalid';
                } else if (validationResult.warnings.length > 0) {
                  newStatus = 'warning';
                } else {
                  newStatus = 'valid';
                }
                
                console.log(`Setting status to ${newStatus} for record ${recordId} based on:`, {
                  errorsCount: validationResult.errors.length,
                  warningsCount: validationResult.warnings.length,
                  freshValidationWarnings: validationResult.warnings
                });
                
                // Update record with new validation results
                const finalRecord = {
                  ...updatedRecord,
                  status: newStatus as 'valid' | 'invalid' | 'warning' | 'pending',
                  errors: validationResult.errors,
                  warnings: validationResult.warnings
                };
                
                setRecords(prev => prev.map(r => r.id === recordId ? finalRecord : r));
              });
            }
            
            return updatedRecord;
          }
          return record;
        });
        
        return updatedRecords;
      });

      // Update summary
      setSummary(prevSummary => {
        const updatedRecords = records.map(r => r.id === recordId ? { ...r, ...updates } : r);
        return {
          total: updatedRecords.length,
          valid: updatedRecords.filter(r => r.status === 'valid').length,
          invalid: updatedRecords.filter(r => r.status === 'invalid').length,
          warning: updatedRecords.filter(r => r.status === 'warning').length,
          pending: updatedRecords.filter(r => r.status === 'pending').length
        };
      });

    } catch (error: any) {
      console.error('Error updating record:', error);
      toast({
        title: "Error", 
        description: "Failed to update record: " + error.message,
        variant: "destructive"
      });
    }
  }, [updateStagingRecord, records, toast]);

  const processRecords = async () => {
    try {
      // Get the latest staging data for processing
      const stagingRecords = await loadStagingRecords();
      await processValidShipments(stagingRecords);
      
      // Clear local state after successful processing
      setRecords([]);
      setSummary({ total: 0, valid: 0, invalid: 0, warning: 0, pending: 0 });
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

  // Placeholder functions for compatibility with BulkShipmentUpload
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      // This would normally handle file upload logic
      // For now, just set an error to indicate this needs implementation
      throw new Error('File upload functionality needs to be implemented in the new system');
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const processValidRecords = async () => {
    await processRecords();
  };

  const clearState = () => {
    setRecords([]);
    setSummary({ total: 0, valid: 0, invalid: 0, warning: 0, pending: 0 });
    setUploadError(null);
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
