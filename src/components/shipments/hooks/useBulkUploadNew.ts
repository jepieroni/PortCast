
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseCSV } from './utils/simpleCsvParser';
import { validateRecord } from './utils/simpleValidator';
import { BulkUploadRecord, BulkUploadState } from './utils/bulkUploadTypes';

type ShipmentType = 'inbound' | 'outbound' | 'intertheater';

export const useBulkUploadNew = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bulkState, setBulkState] = useState<BulkUploadState | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Parse the CSV file
      const text = await file.text();
      const records = parseCSV(text);
      
      console.log('Parsed records:', records.length);

      // Validate each record
      const validatedRecords = records.map(record => {
        const errors = validateRecord(record);
        return {
          ...record,
          status: errors.length === 0 ? 'valid' : 'invalid',
          errors
        } as BulkUploadRecord;
      });

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

      console.log('Validation complete:', summary);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const updateRecord = (recordId: string, updates: Partial<BulkUploadRecord>) => {
    if (!bulkState) return;

    const updatedRecords = bulkState.records.map(record => {
      if (record.id === recordId) {
        const updatedRecord = { ...record, ...updates };
        const errors = validateRecord(updatedRecord);
        return {
          ...updatedRecord,
          status: errors.length === 0 ? 'valid' : 'invalid',
          errors
        } as BulkUploadRecord;
      }
      return record;
    });

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
  };

  const processValidRecords = async () => {
    if (!bulkState) return;

    const validRecords = bulkState.records.filter(r => r.status === 'valid');
    if (validRecords.length === 0) {
      toast({
        title: "No valid records",
        description: "Please fix validation errors before processing",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Translate and insert records one by one
      for (const record of validRecords) {
        // Normalize shipment type
        let shipmentType: ShipmentType = 'inbound';
        const typeStr = record.shipment_type.toLowerCase();
        if (typeStr === 'i' || typeStr === 'inbound') shipmentType = 'inbound';
        else if (typeStr === 'o' || typeStr === 'outbound') shipmentType = 'outbound';
        else if (typeStr === 't' || typeStr === 'intertheater') shipmentType = 'intertheater';

        // Convert date formats
        const pickupDate = convertDateFormat(record.pickup_date);
        const rddDate = convertDateFormat(record.rdd);

        const shipmentData = {
          user_id: user.id,
          gbl_number: record.gbl_number,
          shipper_last_name: record.shipper_last_name,
          shipment_type: shipmentType,
          origin_rate_area: record.origin_rate_area,
          destination_rate_area: record.destination_rate_area,
          pickup_date: pickupDate,
          rdd: rddDate,
          estimated_cube: record.estimated_cube ? parseInt(record.estimated_cube) : null,
          actual_cube: record.actual_cube ? parseInt(record.actual_cube) : null,
          remaining_cube: record.actual_cube ? parseInt(record.actual_cube) : null,
          // For now, use placeholder IDs - these would need proper translation
          target_poe_id: '00000000-0000-0000-0000-000000000000',
          target_pod_id: '00000000-0000-0000-0000-000000000000',
          tsp_id: '00000000-0000-0000-0000-000000000000'
        };

        const { error } = await supabase
          .from('shipments')
          .insert(shipmentData);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: `${validRecords.length} shipments processed successfully`
      });

      setBulkState(null);

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process shipments",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    updateRecord,
    processValidRecords,
    isUploading,
    uploadError,
    bulkState,
    clearState: () => setBulkState(null)
  };
};

const convertDateFormat = (dateString: string): string => {
  // If already in ISO format, return as is
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateString)) {
    return dateString;
  }

  // Convert MM/DD/YY to YYYY-MM-DD
  const shortPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
  const match = dateString.match(shortPattern);
  if (match) {
    const [, month, day, year] = match;
    const fullYear = 2000 + parseInt(year);
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return dateString; // Fallback
};
