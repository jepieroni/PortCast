
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BulkUploadRecord } from './utils/bulkUploadTypes';
import { validateRecordComplete } from './utils/simpleValidator';

interface UseBulkRecordOperationsProps {
  records: BulkUploadRecord[];
  setRecords: React.Dispatch<React.SetStateAction<BulkUploadRecord[]>>;
  updateSummary: (records: BulkUploadRecord[]) => void;
  updateStagingRecord: (recordId: string, updates: Partial<BulkUploadRecord>) => Promise<void>;
}

export const useBulkRecordOperations = ({
  records,
  setRecords,
  updateSummary,
  updateStagingRecord
}: UseBulkRecordOperationsProps) => {
  const { toast } = useToast();

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
              console.log('🔥 BULK RECORD OPS: Skipping re-validation - approved warnings update only');
              return updatedRecord;
            }
            
            // Only re-validate if actual field data changed (not just approved warnings)
            const hasFieldChanges = Object.keys(updates).some(key => 
              key !== 'approved_warnings' && key !== 'status' && key !== 'errors' && key !== 'warnings'
            );
            
            if (hasFieldChanges) {
              console.log('🔥 BULK RECORD OPS: Re-validating due to field changes');
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
      updateSummary(records.map(r => r.id === recordId ? { ...r, ...updates } : r));

    } catch (error: any) {
      console.error('Error updating record:', error);
      toast({
        title: "Error", 
        description: "Failed to update record: " + error.message,
        variant: "destructive"
      });
    }
  }, [updateStagingRecord, records, toast, setRecords, updateSummary]);

  return {
    updateRecord
  };
};
