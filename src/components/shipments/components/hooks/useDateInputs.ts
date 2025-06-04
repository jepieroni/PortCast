import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { parseDateString } from './utils/dateParser';
import { formatDateForInput } from './utils/dateFormatter';
import { ShipmentEditFormData } from './utils/formDataMapper';

/**
 * Hook for managing date input states and handlers
 */
export const useDateInputs = (
  formData: ShipmentEditFormData,
  setFormData: React.Dispatch<React.SetStateAction<ShipmentEditFormData>>
) => {
  const [pickupInputValue, setPickupInputValue] = useState('');
  const [rddInputValue, setRddInputValue] = useState('');

  const initializeDateInputs = useCallback((newFormData: ShipmentEditFormData) => {
    console.log('useDateInputs - initializeDateInputs called with:', {
      pickup_date_raw: newFormData.pickup_date,
      pickup_date_type: typeof newFormData.pickup_date,
      rdd_raw: newFormData.rdd,
      rdd_type: typeof newFormData.rdd,
      pickup_date_truthiness: !!newFormData.pickup_date,
      rdd_truthiness: !!newFormData.rdd
    });

    // Format the dates for display, ensuring we preserve the original values
    const pickupFormatted = newFormData.pickup_date ? formatDateForInput(newFormData.pickup_date) : '';
    const rddFormatted = newFormData.rdd ? formatDateForInput(newFormData.rdd) : '';
    
    console.log('useDateInputs - Date formatting results:', {
      pickup_date_raw: newFormData.pickup_date,
      pickup_formatted: pickupFormatted,
      rdd_raw: newFormData.rdd,
      rdd_formatted: rddFormatted
    });
    
    console.log('useDateInputs - Setting input values:', {
      pickupInputValue: pickupFormatted,
      rddInputValue: rddFormatted
    });
    
    setPickupInputValue(pickupFormatted);
    setRddInputValue(rddFormatted);

    console.log('useDateInputs - Input values set, current state should be:', {
      pickupInputValue: pickupFormatted,
      rddInputValue: rddFormatted
    });
  }, []);

  const handleDateInputChange = useCallback((field: string, value: string) => {
    console.log(`useDateInputs - handleDateInputChange: ${field} = "${value}"`);
    
    // Always update the input value to allow typing
    if (field === 'pickup_date') {
      setPickupInputValue(value);
    } else if (field === 'rdd') {
      setRddInputValue(value);
    }

    // If empty, clear the form data field
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    // Try to parse the date and update form data if valid
    const parsedDate = parseDateString(value);
    if (parsedDate) {
      const isoDate = parsedDate.toISOString().split('T')[0];
      console.log(`useDateInputs - Parsed date for ${field}:`, isoDate);
      setFormData(prev => ({ ...prev, [field]: isoDate }));
    } else {
      // If parsing fails, still update the form data with the raw value
      // This prevents data loss when the user is typing
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, [setFormData]);

  const handleDateInputBlur = useCallback((field: string) => {
    console.log(`useDateInputs - handleDateInputBlur: ${field}`);
    
    // Get the current input value for the field
    const currentValue = field === 'pickup_date' ? pickupInputValue : rddInputValue;
    
    // On blur, try to parse and format the date
    const parsedDate = parseDateString(currentValue);
    if (parsedDate) {
      const isoDate = parsedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [field]: isoDate }));
      
      // Update input to show formatted version using our corrected formatter
      const formatted = formatDateForInput(isoDate);
      if (field === 'pickup_date') {
        setPickupInputValue(formatted);
      } else if (field === 'rdd') {
        setRddInputValue(formatted);
      }
    }
    // If parsing fails, keep the current value as-is to prevent data loss
  }, [setFormData, pickupInputValue, rddInputValue]);

  const handleDateSelect = useCallback((field: string, date: Date | undefined) => {
    console.log(`useDateInputs - handleDateSelect: ${field}`, date);
    
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [field]: isoDate }));
      
      // Update input value to show formatted date using our corrected formatter
      const formatted = formatDateForInput(isoDate);
      if (field === 'pickup_date') {
        setPickupInputValue(formatted);
      } else if (field === 'rdd') {
        setRddInputValue(formatted);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: '' }));
      if (field === 'pickup_date') {
        setPickupInputValue('');
      } else if (field === 'rdd') {
        setRddInputValue('');
      }
    }
  }, [setFormData]);

  console.log('useDateInputs - Current render state:', {
    pickupInputValue,
    rddInputValue,
    formDataPickup: formData.pickup_date,
    formDataRdd: formData.rdd
  });

  return {
    pickupInputValue,
    rddInputValue,
    initializeDateInputs,
    handleDateInputChange,
    handleDateInputBlur,
    handleDateSelect,
  };
};
