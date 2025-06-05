
import { parseCSV } from './utils/simpleCsvParser';
import { validateRecordSync, validateRecord } from './utils/simpleValidator';
import { BulkUploadRecord } from './utils/bulkUploadTypes';

export const useFileUpload = () => {
  const uploadFile = async (file: File) => {
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

      console.log('Final validation summary:', finalSummary);

      return {
        records: detailedValidatedRecords,
        summary: finalSummary
      };

    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  return {
    uploadFile
  };
};
