
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
    const pickupFormatted = formatDateForInput(newFormData.pickup_date);
    const rddFormatted = formatDateForInput(newFormData.rdd);
    
    console.log('useDateInputs - Setting date inputs:', {
      pickup: pickupFormatted,
      rdd: rddFormatted
    });
    
    setPickupInputValue(pickupFormatted);
    setRddInputValue(rddFormatted);
  }, []);

  const handleDateInputChange = useCallback((field: string, value: string) => {
    console.log(`useDateInputs - handleDateInputChange: ${field} = "${value}"`);
    
    // Always update the input value to allow typing
    if (field === 'pickup_date') {
      setPickupInputValue(value);
    } else if (field === 'rdd') {
      setRddInputValue(value);
    }

    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    const parsedDate = parseDateString(value);
    if (parsedDate) {
      setFormData(prev => ({ ...prev, [field]: parsedDate.toISOString().split('T')[0] }));
    }
  }, [setFormData]);

  const handleDateInputBlur = useCallback((field: string, value: string) => {
    console.log(`useDateInputs - handleDateInputBlur: ${field} = "${value}"`);
    
    // On blur, try to parse and format the date
    const parsedDate = parseDateString(value);
    if (parsedDate) {
      const isoDate = parsedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [field]: isoDate }));
      
      // Update input to show formatted version
      const formatted = format(parsedDate, 'MM/dd/yy');
      if (field === 'pickup_date') {
        setPickupInputValue(formatted);
      } else if (field === 'rdd') {
        setRddInputValue(formatted);
      }
    }
  }, [setFormData]);

  const handleDateSelect = useCallback((field: string, date: Date | undefined) => {
    console.log(`useDateInputs - handleDateSelect: ${field}`, date);
    
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [field]: isoDate }));
      
      // Update input value to show formatted date
      const formatted = format(date, 'MM/dd/yy');
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

  return {
    pickupInputValue,
    rddInputValue,
    initializeDateInputs,
    handleDateInputChange,
    handleDateInputBlur,
    handleDateSelect,
  };
};
