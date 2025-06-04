
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

      // First, preserve any existing validation errors (like duplicates)
      const existingErrors = Array.isArray(record.validation_errors) ? record.validation_errors : [];
      console.log('Existing validation errors for', record.gbl_number, ':', existingErrors);

      // Perform field validations
      const requiredFieldErrors = validateRequiredFields(record);
      const dateErrors = validateDates(record);
      const cubeErrors = validateCubeRequirements(record);

      console.log('Field validation results for', record.gbl_number, ':', {
        requiredFieldErrors,
        dateErrors,
        cubeErrors
      });

      // Perform translation validations
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

      // Combine existing errors with new validation errors
      const newValidationErrors = [
        ...requiredFieldErrors,
        ...dateErrors,
        ...cubeErrors,
        ...rateAreaErrors,
        ...portErrors,
        ...tspErrors
      ];

      // Combine existing errors (like duplicates) with new validation errors
      const allErrors = [...existingErrors, ...newValidationErrors];

      const allUpdates = {
        ...rateAreaUpdates,
        ...portUpdates,
        ...tspUpdates
      };

      const finalStatus = allErrors.length === 0 ? 'valid' : 'invalid';

      console.log(`Validation complete for ${record.gbl_number}. Status: ${finalStatus}, Total Errors: ${allErrors.length} (${existingErrors.length} existing + ${newValidationErrors.length} new), Updates:`, allUpdates);
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
