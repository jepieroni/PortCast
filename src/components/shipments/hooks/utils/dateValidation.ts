
export const isValidDateFormat = (dateStr: string): boolean => {
  // Check for YYYY-MM-DD format
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateStr)) {
    const date = new Date(dateStr + 'T00:00:00');
    return !isNaN(date.getTime());
  }

  // Check for MM/DD/YY or MM/DD/YYYY format
  const usPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
  const match = dateStr.match(usPattern);
  if (match) {
    const [, month, day, year] = match;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    let yearNum = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (yearNum < 100) {
      yearNum = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    }
    
    // Basic range checks
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;
    
    // Create date and validate it's real
    const date = new Date(yearNum, monthNum - 1, dayNum);
    return date.getFullYear() === yearNum && 
           date.getMonth() === monthNum - 1 && 
           date.getDate() === dayNum;
  }

  return false;
};

export const parseDate = (dateStr: string): Date | null => {
  // Check for YYYY-MM-DD format
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }

  // Check for MM/DD/YY or MM/DD/YYYY format
  const usPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
  const match = dateStr.match(usPattern);
  if (match) {
    const [, month, day, year] = match;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    let yearNum = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (yearNum < 100) {
      yearNum = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    }
    
    return new Date(yearNum, monthNum - 1, dayNum);
  }

  return null;
};

export const validateDateFields = (record: { pickup_date: string; rdd: string }): string[] => {
  const errors: string[] = [];

  if (!record.pickup_date || record.pickup_date.trim() === '') {
    errors.push('Pickup date is required');
  } else {
    const dateStr = record.pickup_date.trim();
    if (!isValidDateFormat(dateStr)) {
      errors.push('Pickup date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    }
  }
  
  if (!record.rdd || record.rdd.trim() === '') {
    errors.push('Required delivery date is required');
  } else {
    const dateStr = record.rdd.trim();
    if (!isValidDateFormat(dateStr)) {
      errors.push('Required delivery date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    }
  }

  return errors;
};
