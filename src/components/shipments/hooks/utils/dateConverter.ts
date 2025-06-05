
/**
 * Utility for converting date formats between different systems
 */
export const convertDateFormat = (dateString: string): string => {
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
