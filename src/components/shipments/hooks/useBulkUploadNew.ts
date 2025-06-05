
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseCSV } from './utils/simpleCsvParser';
import { validateRecordSync, validateRecord } from './utils/simpleValidator';
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
      console.log('Raw CSV text preview:', text.substring(0, 500));
      
      const records = parseCSV(text);
      console.log('Parsed records:', records.length);
      console.log('First record sample:', records[0]);

      // Initial validation using synchronous validator
      const validatedRecords = records.map((record, index) => {
        console.log(`Initial validation for record ${index + 1}:`, {
          id: record.id,
          gbl_number: record.gbl_number,
          shipment_type: record.shipment_type,
          pickup_date: record.pickup_date
        });
        const errors = validateRecordSync(record);
        console.log(`Initial validation errors for record ${index + 1}:`, errors);
        
        return {
          ...record,
          status: errors.length === 0 ? 'pending' : 'invalid',
          errors
        } as BulkUploadRecord;
      });

      // Calculate summary
      const summary = {
        total: validatedRecords.length,
        valid: validatedRecords.filter(r => r.status === 'pending').length,
        invalid: validatedRecords.filter(r => r.status === 'invalid').length,
        pending: validatedRecords.filter(r => r.status === 'pending').length
      };

      setBulkState({
        records: validatedRecords,
        summary
      });

      console.log('Initial validation summary:', summary);
      console.log('Sample validated records:', validatedRecords.slice(0, 3));

      // Perform detailed validation with database lookups for pending records
      const detailedValidatedRecords = await Promise.all(
        validatedRecords.map(async (record) => {
          if (record.status === 'pending') {
            console.log(`Performing detailed validation for record ${record.id}`);
            const detailedErrors = await validateRecord(record);
            console.log(`Detailed validation errors for record ${record.id}:`, detailedErrors);
            
            return {
              ...record,
              status: detailedErrors.length === 0 ? 'valid' : 'invalid',
              errors: detailedErrors
            } as BulkUploadRecord;
          }
          return record;
        })
      );

      // Update summary after detailed validation
      const finalSummary = {
        total: detailedValidatedRecords.length,
        valid: detailedValidatedRecords.filter(r => r.status === 'valid').length,
        invalid: detailedValidatedRecords.filter(r => r.status === 'invalid').length,
        pending: 0
      };

      setBulkState({
        records: detailedValidatedRecords,
        summary: finalSummary
      });

      console.log('Final validation summary:', finalSummary);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const updateRecord = async (recordId: string, updates: Partial<BulkUploadRecord>) => {
    if (!bulkState) return;

    console.log(`Updating record ${recordId} with:`, updates);

    const updatedRecords = await Promise.all(
      bulkState.records.map(async (record) => {
        if (record.id === recordId) {
          const updatedRecord = { ...record, ...updates };
          console.log(`Updated record ${recordId}:`, {
            original_shipment_type: record.shipment_type,
            updated_shipment_type: updatedRecord.shipment_type,
            original_pickup_date: record.pickup_date,
            updated_pickup_date: updatedRecord.pickup_date
          });
          
          // Clear existing resolved IDs to force re-validation
          updatedRecord.target_poe_id = undefined;
          updatedRecord.target_pod_id = undefined;
          updatedRecord.tsp_id = undefined;
          
          const errors = await validateRecord(updatedRecord);
          console.log(`Re-validation errors for record ${recordId}:`, errors);
          
          return {
            ...updatedRecord,
            status: errors.length === 0 ? 'valid' : 'invalid',
            errors
          } as BulkUploadRecord;
        }
        return record;
      })
    );

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

      // Process records one by one
      for (const record of validRecords) {
        // Normalize shipment type
        let shipmentType: ShipmentType = 'inbound';
        const typeStr = record.shipment_type.toLowerCase().trim();
        if (typeStr === 'i' || typeStr === 'inbound') shipmentType = 'inbound';
        else if (typeStr === 'o' || typeStr === 'outbound') shipmentType = 'outbound';
        else if (typeStr === 't' || typeStr === 'intertheater') shipmentType = 'intertheater';

        // Convert date formats
        const pickupDate = convertDateFormat(record.pickup_date);
        const rddDate = convertDateFormat(record.rdd);

        // Use the resolved IDs from validation, or throw error if missing
        if (!record.target_poe_id || !record.target_pod_id || !record.tsp_id) {
          throw new Error(`Missing resolved IDs for record ${record.gbl_number}. Please re-validate the record.`);
        }

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
          target_poe_id: record.target_poe_id,
          target_pod_id: record.target_pod_id,
          tsp_id: record.tsp_id
        };

        console.log('Inserting shipment data:', shipmentData);

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

  // Convert MM/DD/YY or MM/DD/YYYY to YYYY-MM-DD
  const usPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
  const match = dateString.match(usPattern);
  if (match) {
    const [, month, day, year] = match;
    let fullYear = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (fullYear < 100) {
      fullYear = fullYear < 50 ? 2000 + fullYear : 1900 + fullYear;
    }
    
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return dateString; // Fallback
};
