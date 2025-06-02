import { useState, useEffect, useRef } from 'react';
import { ShipmentFormData } from '../types';
import { useShipmentValidation } from './useShipmentValidation';
import { useShipmentSubmission } from './useShipmentSubmission';
import { useFieldValidation } from './useFieldValidation';
import { shouldAllowActualEntry, formatFieldValue } from '../utils/shipmentUtils';

export const useShipmentForm = (onBack: () => void, onSuccess?: () => void, tsps?: any[]) => {
  const [formData, setFormData] = useState<ShipmentFormData>({
    gblNumber: '',
    shipperLastName: '',
    pickupDate: undefined,
    rdd: undefined,
    shipmentType: '',
    originRateArea: '',
    destinationRateArea: '',
    targetPoeId: '',
    targetPodId: '',
    tspId: '',
    estimatedPieces: '',
    estimatedCube: '',
    actualPieces: '',
    actualCube: ''
  });

  const [canEnterActuals, setCanEnterActuals] = useState(false);
  const { validateForm } = useShipmentValidation();
  const { submitShipment } = useShipmentSubmission();
  const fieldValidation = useFieldValidation();
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-populate TSP if only one available
  useEffect(() => {
    if (tsps && tsps.length === 1 && !formData.tspId) {
      setFormData(prev => ({ ...prev, tspId: tsps[0].id }));
    }
  }, [tsps, formData.tspId]);

  // Check if pickup date allows actual entry
  useEffect(() => {
    setCanEnterActuals(shouldAllowActualEntry(formData.pickupDate));
  }, [formData.pickupDate]);

  const handleInputChange = (field: string, value: string) => {
    const formattedValue = formatFieldValue(field, value);
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear field error when user starts typing
    if (fieldValidation.hasError(field)) {
      fieldValidation.clearFieldError(field);
    }
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
    
    // Clear field error when user changes date
    if (fieldValidation.hasError(field)) {
      fieldValidation.clearFieldError(field);
    }
  };

  const focusFirstError = (firstErrorField: string) => {
    const fieldRef = fieldRefs.current[firstErrorField];
    if (fieldRef) {
      fieldRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Focus the input within the field
      const input = fieldRef.querySelector('input, select, button[role="combobox"]') as HTMLElement;
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    fieldValidation.clearAllErrors();
    const validationResult = validateForm(formData);
    
    if (!validationResult.isValid) {
      fieldValidation.setMultipleErrors(validationResult.errors);
      
      if (validationResult.firstErrorField) {
        focusFirstError(validationResult.firstErrorField);
      }
      return;
    }

    const success = await submitShipment(formData);
    if (success) {
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    }
  };

  const setFieldRef = (field: string, ref: HTMLDivElement | null) => {
    fieldRefs.current[field] = ref;
  };

  return {
    formData,
    canEnterActuals,
    handleInputChange,
    handleDateChange,
    handleSubmit,
    fieldValidation,
    setFieldRef
  };
};
