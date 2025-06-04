
import { useCallback } from 'react';
import { validateRequiredFields, validateDates, validateCubeRequirements } from './utils/fieldValidators';
import { validateAndTranslateRateAreas, validateAndTranslatePorts, validateAndFindTsp } from './utils/translationService';
import { getUserOrganization, updateStagingRecord, markRecordAsInvalid } from './utils/databaseService';

export const useRecordValidation = () => {
  const validateRecord = async (record: any) => {
    try {
      console.log('Starting validation for record:', record.gbl_number);
      
      // Get user's organization for translations
      const organizationId = await getUserOrganization();

      // Perform field validations
      const requiredFieldErrors = validateRequiredFields(record);
      const dateErrors = validateDates(record);
      const cubeErrors = validateCubeRequirements(record);

      // Perform translation validations
      const { errors: rateAreaErrors, updates: rateAreaUpdates } = await validateAndTranslateRateAreas(record, organizationId);
      const { errors: portErrors, updates: portUpdates } = await validateAndTranslatePorts(record, organizationId);
      const { errors: tspErrors, updates: tspUpdates } = await validateAndFindTsp(record, organizationId);

      // Combine all errors and updates
      const allErrors = [
        ...requiredFieldErrors,
        ...dateErrors,
        ...cubeErrors,
        ...rateAreaErrors,
        ...portErrors,
        ...tspErrors
      ];

      const allUpdates = {
        ...rateAreaUpdates,
        ...portUpdates,
        ...tspUpdates
      };

      console.log(`Validation complete for ${record.gbl_number}. Errors: ${allErrors.length}, Updates:`, allUpdates);

      // Update record
      await updateStagingRecord(
        record.id,
        allUpdates,
        allErrors.length === 0 ? 'valid' : 'invalid',
        allErrors
      );

      console.log(`Record ${record.gbl_number} updated successfully`);

    } catch (error: any) {
      console.error('Validation error for record', record.gbl_number, ':', error);
      const errors = [`Validation failed: ${error.message || 'System error'}`];
      
      await markRecordAsInvalid(record.id, errors);
    }
  };

  return { validateRecord };
};
