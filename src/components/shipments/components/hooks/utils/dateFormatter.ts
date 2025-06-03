
import { format } from 'date-fns';

/**
 * Utility for formatting dates for input display
 */
export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return format(date, 'MM/dd/yy');
};
