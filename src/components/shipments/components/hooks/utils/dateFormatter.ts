
import { format } from 'date-fns';

/**
 * Utility for formatting dates for input display
 */
export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // For ISO date strings (YYYY-MM-DD), parse them as local dates
  // to avoid timezone shifting issues
  const isISODateString = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  
  if (isISODateString) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return format(date, 'MM/dd/yy');
  }
  
  // For other date formats, use standard parsing
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return format(date, 'MM/dd/yy');
};
