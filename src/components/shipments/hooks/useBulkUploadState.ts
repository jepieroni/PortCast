
import { useState } from 'react';
import { BulkUploadRecord } from './utils/bulkUploadTypes';

export const useBulkUploadState = () => {
  const [records, setRecords] = useState<BulkUploadRecord[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    warning: 0,
    pending: 0
  });
  const [uploadSessionId, setUploadSessionId] = useState<string>('');

  // Create bulkState object for compatibility with BulkShipmentUpload
  const bulkState = records.length > 0 ? { records, summary } : null;

  const updateSummary = (updatedRecords: BulkUploadRecord[]) => {
    setSummary({
      total: updatedRecords.length,
      valid: updatedRecords.filter(r => r.status === 'valid').length,
      invalid: updatedRecords.filter(r => r.status === 'invalid').length,
      warning: updatedRecords.filter(r => r.status === 'warning').length,
      pending: updatedRecords.filter(r => r.status === 'pending').length
    });
  };

  const clearState = () => {
    setRecords([]);
    setSummary({ total: 0, valid: 0, invalid: 0, warning: 0, pending: 0 });
  };

  return {
    records,
    setRecords,
    summary,
    setSummary,
    uploadSessionId,
    setUploadSessionId,
    bulkState,
    updateSummary,
    clearState
  };
};
