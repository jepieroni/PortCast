
import { VALID_STATE_CODES } from '@/constants/stateCodes';

export const validateState = (stateValue: string): { isValid: boolean; error: string } => {
  if (!stateValue) {
    return { isValid: true, error: '' };
  }
  
  const upperState = stateValue.toUpperCase();
  if (!VALID_STATE_CODES.includes(upperState)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid 2-letter US state code (e.g., CA, NY, TX)' 
    };
  }
  
  return { isValid: true, error: '' };
};
