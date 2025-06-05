
export const getValidationWarnings = (record: any): string[] => {
  console.log(`=== getValidationWarnings DEBUG for ${record.gbl_number || record.id} ===`);
  console.log('record.warnings:', record.warnings);
  console.log('record.validation_warnings:', record.validation_warnings);
  
  // Use the warnings array from the converted record first
  if (record.warnings && Array.isArray(record.warnings)) {
    console.log('Using record.warnings:', record.warnings);
    return record.warnings;
  }
  
  // Fallback to validation_warnings if needed
  if (!record.validation_warnings) {
    console.log('No validation_warnings found');
    return [];
  }
  
  if (Array.isArray(record.validation_warnings)) {
    console.log('Using array validation_warnings:', record.validation_warnings);
    return record.validation_warnings;
  }
  
  if (typeof record.validation_warnings === 'string') {
    try {
      const parsed = JSON.parse(record.validation_warnings);
      console.log('Parsed validation_warnings:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.log('Failed to parse, using as single string');
      return [record.validation_warnings];
    }
  }
  
  console.log('=== END getValidationWarnings DEBUG ===');
  return [];
};

export const getValidationErrors = (record: any): string[] => {
  console.log(`=== getValidationErrors DEBUG for ${record.gbl_number || record.id} ===`);
  console.log('record.errors:', record.errors);
  console.log('record.validation_errors:', record.validation_errors);
  
  // Use the errors array from the converted record first
  if (record.errors && Array.isArray(record.errors)) {
    console.log('Using record.errors:', record.errors);
    return record.errors;
  }
  
  // Fallback to validation_errors if needed
  if (!record.validation_errors) {
    console.log('No validation_errors found');
    return [];
  }
  
  if (Array.isArray(record.validation_errors)) {
    console.log('Using array validation_errors:', record.validation_errors);
    return record.validation_errors;
  }
  
  if (typeof record.validation_errors === 'string') {
    try {
      const parsed = JSON.parse(record.validation_errors);
      console.log('Parsed validation_errors:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.log('Failed to parse, using as single string');
      return [record.validation_errors];
    }
  }
  
  console.log('=== END getValidationErrors DEBUG ===');
  return [];
};
