
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
    // Always get fresh data before validation
    await refreshData();
    // Add a small delay to ensure the refresh is complete
    await new Promise(resolve => setTimeout(resolve, 200));
    // Get the fresh staging data after refresh
    const freshStagingData = await refreshData();
    console.log('Validating with fresh staging data, count:', freshStagingData?.length || 'unknown');
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
