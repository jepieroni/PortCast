
import { useState, useEffect } from 'react';
import { ShipmentFormData } from '../types';
import { useShipmentValidation } from './useShipmentValidation';
import { useShipmentSubmission } from './useShipmentSubmission';
import { shouldAllowActualEntry, formatFieldValue } from '../utils/shipmentUtils';

export const useShipmentForm = (onBack: () => void) => {
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

  // Check if pickup date allows actual entry
  useEffect(() => {
    setCanEnterActuals(shouldAllowActualEntry(formData.pickupDate));
  }, [formData.pickupDate]);

  const handleInputChange = (field: string, value: string) => {
    const formattedValue = formatFieldValue(field, value);
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    const success = await submitShipment(formData);
    if (success) {
      onBack();
    }
  };

  return {
    formData,
    canEnterActuals,
    handleInputChange,
    handleDateChange,
    handleSubmit
  };
};
