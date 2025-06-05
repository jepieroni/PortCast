
import { updateRecord } from './utils/recordUpdateService';
import { useShipmentProcessor } from './utils/shipmentProcessingService';

export const useRecordProcessing = () => {
  const { processValidRecords } = useShipmentProcessor();

  return {
    updateRecord,
    processValidRecords
  };
};
