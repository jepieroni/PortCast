
import { useState, useCallback } from 'react';

export interface FieldError {
  field: string;
  message: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: FieldError[];
  firstErrorField?: string;
}

export const useFieldValidation = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const setMultipleErrors = useCallback((errors: FieldError[]) => {
    const errorMap = errors.reduce((acc, { field, message }) => {
      acc[field] = message;
      return acc;
    }, {} as Record<string, string>);
    setFieldErrors(errorMap);
  }, []);

  const hasError = useCallback((field: string) => {
    return !!fieldErrors[field];
  }, [fieldErrors]);

  const getError = useCallback((field: string) => {
    return fieldErrors[field] || '';
  }, [fieldErrors]);

  return {
    fieldErrors,
    clearFieldError,
    setFieldError,
    clearAllErrors,
    setMultipleErrors,
    hasError,
    getError
  };
};
