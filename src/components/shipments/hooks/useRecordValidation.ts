
import { useCallback } from 'react';
import { validateRequiredFields, validateDates, validateCubeRequirements } from './utils/fieldValidators';
import { validateAndTranslateRateAreas, validateAndTranslatePorts, validateAndFindTsp } from './utils/translationService';
import { getUserOrganization, updateStagingRecord, markRecordAsInvalid } from './utils/databaseService';

export const useRecordValidation = () => {
  const validateRecord = async (record: any) => {
    try {
      console.log('Starting validation for record:', record.gbl_number, 'with ID:', record.id);
      
      // Get user's organization for translations
      const organizationId = await getUserOrganization();

      // IMPORTANT: Only preserve duplicate errors, clear other validation errors
      const existingErrors = Array.isArray(record.validation_errors) 
        ? record.validation_errors.filter((error: string) => error.toLowerCase().includes('duplicate'))
        : [];
      console.log('Existing duplicate errors for', record.gbl_number, ':', existingErrors);

      // Perform translation validations first to get updated data
      const { errors: rateAreaErrors, updates: rateAreaUpdates } = await validateAndTranslateRateAreas(record, organizationId);
      const { errors: portErrors, updates: portUpdates } = await validateAndTranslatePorts(record, organizationId);
      const { errors: tspErrors, updates: tspUpdates } = await validateAndFindTsp(record, organizationId);

      console.log('Translation validation results for', record.gbl_number, ':', {
        rateAreaErrors,
        portErrors,
        tspErrors,
        rateAreaUpdates,
        portUpdates,
        tspUpdates
      });

      // Create updated record with translation results for field validation
      const updatedRecord = {
        ...record,
        ...rateAreaUpdates,
        ...portUpdates,
        ...tspUpdates
      };

      console.log('Updated record for field validation:', {
        gbl_number: updatedRecord.gbl_number,
        shipment_type: updatedRecord.shipment_type,
        origin_rate_area: updatedRecord.origin_rate_area,
        destination_rate_area: updatedRecord.destination_rate_area
      });

      // Perform field validations on the updated record
      const requiredFieldErrors = validateRequiredFields(updatedRecord);
      const dateErrors = validateDates(updatedRecord);
      const cubeErrors = validateCubeRequirements(updatedRecord);

      console.log('Field validation results for', record.gbl_number, ':', {
        requiredFieldErrors,
        dateErrors,
        cubeErrors
      });

      // Combine only new validation errors (not old stale ones)
      const newValidationErrors = [
        ...requiredFieldErrors,
        ...dateErrors,
        ...cubeErrors,
        ...rateAreaErrors,
        ...portErrors,
        ...tspErrors
      ];

      // Combine only duplicate errors with new validation errors
      const allErrors = [...existingErrors, ...newValidationErrors];

      const allUpdates = {
        ...rateAreaUpdates,
        ...portUpdates,
        ...tspUpdates
      };

      const finalStatus = allErrors.length === 0 ? 'valid' : 'invalid';

      console.log(`Validation complete for ${record.gbl_number}. Status: ${finalStatus}, Total Errors: ${allErrors.length} (${existingErrors.length} duplicate + ${newValidationErrors.length} new), Updates:`, allUpdates);
      console.log('All errors for', record.gbl_number, ':', allErrors);

      // Update record with final status and results
      await updateStagingRecord(
        record.id,
        allUpdates,
        finalStatus,
        allErrors
      );

      console.log(`Record ${record.gbl_number} updated successfully with status: ${finalStatus}`);

    } catch (error: any) {
      console.error('Validation error for record', record.gbl_number, ':', error);
      const errors = [`Validation failed: ${error.message || 'System error'}`];
      
      try {
        await markRecordAsInvalid(record.id, errors);
        console.log(`Record ${record.gbl_number} marked as invalid due to validation error`);
      } catch (markError) {
        console.error('Failed to mark record as invalid:', markError);
      }
    }
  };

  return { validateRecord };
};
