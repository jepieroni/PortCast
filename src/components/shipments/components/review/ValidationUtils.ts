
export const getValidationWarnings = (record: any): string[] => {
  // Use the warnings array from the converted record first
  if (record.warnings && Array.isArray(record.warnings)) {
    return record.warnings;
  }
  
  // Fallback to validation_warnings if needed
  if (!record.validation_warnings) return [];
  if (Array.isArray(record.validation_warnings)) return record.validation_warnings;
  if (typeof record.validation_warnings === 'string') {
    try {
      const parsed = JSON.parse(record.validation_warnings);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [record.validation_warnings];
    }
  }
  return [];
};

export const getValidationErrors = (record: any): string[] => {
  // Use the errors array from the converted record first
  if (record.errors && Array.isArray(record.errors)) {
    return record.errors;
  }
  
  // Fallback to validation_errors if needed
  if (!record.validation_errors) return [];
  if (Array.isArray(record.validation_errors)) return record.validation_errors;
  if (typeof record.validation_errors === 'string') {
    try {
      const parsed = JSON.parse(record.validation_errors);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [record.validation_errors];
    }
  }
  return [];
};
