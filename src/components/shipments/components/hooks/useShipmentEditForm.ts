
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const parseDateString = (dateStr: string): Date | null => {
  // Remove any non-digit characters except /
  const cleaned = dateStr.replace(/[^\d\/]/g, '');
  
  // Check for MM/DD/YY or MM/DD/YYYY format
  const mmddyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  const match = cleaned.match(mmddyyPattern);
  
  if (match) {
    let [, month, day, year] = match;
    
    // Convert 2-digit year to 4-digit year
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const yearNum = parseInt(year);
      
      // If year is less than 50, assume 20xx, otherwise 19xx
      if (yearNum < 50) {
        year = (currentCentury + yearNum).toString();
      } else {
        year = (currentCentury - 100 + yearNum).toString();
      }
    }
    
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate the date
    if (parsedDate.getMonth() === parseInt(month) - 1 && 
        parsedDate.getDate() === parseInt(day) &&
        parsedDate.getFullYear() === parseInt(year)) {
      return parsedDate;
    }
  }
  
  return null;
};

const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return format(date, 'MM/dd/yy');
};

export const useShipmentEditForm = (shipment: any) => {
  const [formData, setFormData] = useState({
    gbl_number: '',
    shipper_last_name: '',
    shipment_type: '',
    origin_rate_area: '',
    destination_rate_area: '',
    pickup_date: '',
    rdd: '',
    estimated_cube: '',
    actual_cube: '',
    remaining_cube: '',
    target_poe_id: '',
    target_pod_id: '',
    tsp_id: '',
  });

  // Local state for date input values
  const [pickupInputValue, setPickupInputValue] = useState('');
  const [rddInputValue, setRddInputValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('useShipmentEditForm - useEffect triggered with shipment:', shipment);
    
    if (shipment) {
      const newFormData = {
        gbl_number: shipment.gbl_number || '',
        shipper_last_name: shipment.shipper_last_name || '',
        shipment_type: shipment.shipment_type || '',
        origin_rate_area: shipment.origin_rate_area || '',
        destination_rate_area: shipment.destination_rate_area || '',
        pickup_date: shipment.pickup_date || '',
        rdd: shipment.rdd || '',
        estimated_cube: shipment.estimated_cube?.toString() || '',
        actual_cube: shipment.actual_cube?.toString() || '',
        remaining_cube: shipment.remaining_cube?.toString() || '',
        target_poe_id: shipment.target_poe_id || '',
        target_pod_id: shipment.target_pod_id || '',
        tsp_id: shipment.tsp_id || '',
      };
      
      console.log('useShipmentEditForm - Setting form data:', newFormData);
      console.log('useShipmentEditForm - Critical fields check:', {
        origin_rate_area: newFormData.origin_rate_area,
        destination_rate_area: newFormData.destination_rate_area,
        tsp_id: newFormData.tsp_id,
        target_poe_id: newFormData.target_poe_id,
        target_pod_id: newFormData.target_pod_id
      });
      
      setFormData(newFormData);
      
      // Initialize date input values
      const pickupFormatted = formatDateForInput(newFormData.pickup_date);
      const rddFormatted = formatDateForInput(newFormData.rdd);
      
      console.log('useShipmentEditForm - Setting date inputs:', {
        pickup: pickupFormatted,
        rdd: rddFormatted
      });
      
      setPickupInputValue(pickupFormatted);
      setRddInputValue(rddFormatted);
      setIsInitialized(true);
      
      console.log('useShipmentEditForm - Form initialization complete');
    } else {
      console.log('useShipmentEditForm - No shipment data provided');
      setIsInitialized(false);
    }
  }, [shipment]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`useShipmentEditForm - handleInputChange: ${field} = "${value}"`);
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log(`useShipmentEditForm - Updated form data for ${field}:`, updated[field]);
      return updated;
    });
  };

  const handleDateInputChange = (field: string, value: string) => {
    console.log(`useShipmentEditForm - handleDateInputChange: ${field} = "${value}"`);
    
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
  };

  const handleDateInputBlur = (field: string, value: string) => {
    console.log(`useShipmentEditForm - handleDateInputBlur: ${field} = "${value}"`);
    
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
  };

  const handleDateSelect = (field: string, date: Date | undefined) => {
    console.log(`useShipmentEditForm - handleDateSelect: ${field}`, date);
    
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
  };

  console.log('useShipmentEditForm - Current state:', {
    isInitialized,
    hasFormData: Object.keys(formData).some(key => formData[key] !== ''),
    formDataSample: {
      gbl_number: formData.gbl_number,
      origin_rate_area: formData.origin_rate_area,
      tsp_id: formData.tsp_id
    }
  });

  return {
    formData,
    pickupInputValue,
    rddInputValue,
    isInitialized,
    handleInputChange,
    handleDateInputChange,
    handleDateInputBlur,
    handleDateSelect,
  };
};
