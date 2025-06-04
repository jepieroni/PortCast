
import { format } from 'date-fns';

/**
 * Utility for formatting dates for input display
 */
export const formatDateForInput = (dateStr: string): string => {
  console.log('formatDateForInput - Input:', { dateStr, type: typeof dateStr });
  
  if (!dateStr) {
    console.log('formatDateForInput - Empty input, returning empty string');
    return '';
  }
  
  // For ISO date strings (YYYY-MM-DD), parse them as local dates
  // to avoid timezone shifting issues
  const isISODateString = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  
  console.log('formatDateForInput - Is ISO date string:', isISODateString);
  
  if (isISODateString) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const formatted = format(date, 'MM/dd/yy');
    console.log('formatDateForInput - ISO format result:', { input: dateStr, output: formatted });
    return formatted;
  }
  
  // For other date formats, use standard parsing
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.log('formatDateForInput - Invalid date, returning empty string');
    return '';
  }
  const formatted = format(date, 'MM/dd/yy');
  console.log('formatDateForInput - Standard format result:', { input: dateStr, output: formatted });
  return formatted;
};
