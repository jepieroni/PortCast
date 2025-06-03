
import { useState, useEffect, useCallback } from 'react';
import { 
  createInitialFormData, 
  mapShipmentToFormData, 
  ShipmentEditFormData 
} from './utils/formDataMapper';
import { useDateInputs } from './useDateInputs';

export const useShipmentEditForm = (shipment: any) => {
  const [formData, setFormData] = useState<ShipmentEditFormData>(createInitialFormData());
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    pickupInputValue,
    rddInputValue,
    initializeDateInputs,
    handleDateInputChange,
    handleDateInputBlur,
    handleDateSelect,
  } = useDateInputs(formData, setFormData);

  useEffect(() => {
    console.log('useShipmentEditForm - useEffect triggered with shipment:', shipment);
    
    if (shipment) {
      const newFormData = mapShipmentToFormData(shipment);
      
      console.log('useShipmentEditForm - Setting form data:', newFormData);
      console.log('useShipmentEditForm - Critical fields check:', {
        origin_rate_area: newFormData.origin_rate_area,
        destination_rate_area: newFormData.destination_rate_area,
        tsp_id: newFormData.tsp_id,
        target_poe_id: newFormData.target_poe_id,
        target_pod_id: newFormData.target_pod_id
      });
      
      setFormData(newFormData);
      initializeDateInputs(newFormData);
      setIsInitialized(true);
      
      console.log('useShipmentEditForm - Form initialization complete');
    } else {
      console.log('useShipmentEditForm - No shipment data provided');
      setIsInitialized(false);
    }
  }, [shipment, initializeDateInputs]);

  const handleInputChange = useCallback((field: string, value: string) => {
    console.log(`useShipmentEditForm - handleInputChange: ${field} = "${value}"`);
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log(`useShipmentEditForm - Updated form data for ${field}:`, updated[field]);
      return updated;
    });
  }, []);

  console.log('useShipmentEditForm - Current state:', {
    isInitialized,
    hasFormData: Object.keys(formData).some(key => formData[key as keyof ShipmentEditFormData] !== ''),
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
