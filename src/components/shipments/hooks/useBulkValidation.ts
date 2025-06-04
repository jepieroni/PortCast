
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRecordValidation } from './useRecordValidation';

export const useBulkValidation = () => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const { validateRecord } = useRecordValidation();

  const validateAllRecords = useCallback(async (stagingData: any[], refetch: () => void) => {
    if (stagingData.length === 0) {
      console.log('No staging data to validate');
      return;
    }

    setIsValidating(true);
    try {
      console.log('Starting validation for', stagingData.length, 'records');
      
      // Validate all records, not just pending ones
      for (const record of stagingData) {
        await validateRecord(record);
      }
      
      console.log('Validation complete, refreshing data');
      await refetch();
    } catch (error: any) {
      console.error('Batch validation error:', error);
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate some records",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  }, [validateRecord, toast]);

  return {
    isValidating,
    validateAllRecords
  };
};
