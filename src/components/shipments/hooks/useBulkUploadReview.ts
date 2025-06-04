
import { useState, useCallback, useEffect } from 'react';
import { useStagingData } from './useStagingData';
import { useBulkValidation } from './useBulkValidation';
import { useShipmentProcessing } from './useShipmentProcessing';

export const useBulkUploadReview = (uploadSessionId: string) => {
  const [hasRunInitialValidation, setHasRunInitialValidation] = useState(false);

  const { stagingData, validationSummary, refreshData } = useStagingData(uploadSessionId);
  const { isValidating, validateAllRecords } = useBulkValidation();
  const { isProcessing, processValidShipments } = useShipmentProcessing(uploadSessionId);

  // Run initial validation only once when component mounts and has data
  useEffect(() => {
    if (stagingData.length > 0 && !hasRunInitialValidation && !isValidating) {
      console.log('Running initial validation for', stagingData.length, 'records');
      setHasRunInitialValidation(true);
      validateAllRecords(stagingData, refreshData);
    }
  }, [stagingData.length, hasRunInitialValidation, isValidating, validateAllRecords, refreshData]);

  const handleProcessValidShipments = useCallback(async () => {
    return await processValidShipments(stagingData);
  }, [processValidShipments, stagingData]);

  const handleValidateAllRecords = useCallback(async () => {
    console.log('handleValidateAllRecords called, refreshing data first');
    // Always get fresh data before validation
    const refreshResult = await refreshData();
    console.log('Data refreshed, result type:', typeof refreshResult);
    
    // Add a small delay to ensure the refresh is complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Use the current stagingData which should be updated after refresh
    console.log('Current staging data count:', stagingData.length);
    return await validateAllRecords(stagingData, refreshData);
  }, [validateAllRecords, stagingData, refreshData]);

  return {
    stagingData,
    validationSummary,
    isValidating: isValidating && !hasRunInitialValidation,
    isProcessing,
    validateAllRecords: handleValidateAllRecords,
    processValidShipments: handleProcessValidShipments,
    refreshData,
    hasRunInitialValidation
  };
};
