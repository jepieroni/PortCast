
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BulkUploadRecord } from './utils/bulkUploadTypes';
import { 
  checkForStagingRecords as checkStagingRecords,
  loadStagingRecordsFromDatabase,
  cleanupStagingRecords as cleanupRecords
} from './utils/stagingRecordsService';
import { convertStagingRecordToBulkRecord } from './utils/stagingRecordsConverter';
import { updateStagingRecord as updateRecord } from './utils/stagingRecordsUpdater';

export const useStagingRecords = () => {
  const { toast } = useToast();
  const [hasStagingRecords, setHasStagingRecords] = useState(false);
  const [isCheckingStagingRecords, setIsCheckingStagingRecords] = useState(false);

  const checkForStagingRecords = async () => {
    setIsCheckingStagingRecords(true);
    try {
      const hasRecords = await checkStagingRecords();
      setHasStagingRecords(hasRecords);
      return hasRecords;
    } catch (error: any) {
      console.error('Error checking staging records:', error);
      setHasStagingRecords(false);
      return false;
    } finally {
      setIsCheckingStagingRecords(false);
    }
  };

  const loadStagingRecords = async () => {
    try {
      const stagingRecords = await loadStagingRecordsFromDatabase();

      if (stagingRecords.length === 0) {
        setHasStagingRecords(false);
        toast({
          title: "No staging records found",
          description: "All previous uploads have been processed.",
        });
        return [];
      }

      console.log('Raw staging records before conversion:', stagingRecords.map(r => ({
        id: r.id,
        gbl_number: r.gbl_number,
        validation_status: r.validation_status,
        validation_warnings: r.validation_warnings,
        warnings_type: typeof r.validation_warnings,
        warnings_stringified: JSON.stringify(r.validation_warnings)
      })));

      // Convert staging records to BulkUploadRecord format
      const convertedRecords: BulkUploadRecord[] = stagingRecords.map(convertStagingRecordToBulkRecord);

      console.log('Converted records summary:', convertedRecords.map(r => ({
        id: r.id,
        gbl_number: r.gbl_number,
        status: r.status,
        warnings: r.warnings,
        warnings_length: r.warnings?.length || 0,
        validation_status: r.validation_status,
        validation_warnings: r.validation_warnings
      })));

      console.log('Records with warnings after conversion:', convertedRecords.filter(r => r.warnings && r.warnings.length > 0));

      // Return the converted records without re-validation since they're already validated
      return convertedRecords;

    } catch (error: any) {
      console.error('Error loading staging records:', error);
      throw error;
    }
  };

  const updateStagingRecord = async (recordId: string, updates: Partial<BulkUploadRecord>) => {
    try {
      await updateRecord(recordId, updates);
    } catch (error: any) {
      console.error('Error updating staging record:', error);
      throw error;
    }
  };

  const cleanupStagingRecords = async (recordIds: string[]) => {
    await cleanupRecords(recordIds);
  };

  const clearStagingState = () => {
    setHasStagingRecords(false);
  };

  return {
    hasStagingRecords,
    isCheckingStagingRecords,
    checkForStagingRecords,
    loadStagingRecords,
    updateStagingRecord,
    cleanupStagingRecords,
    clearStagingState
  };
};
