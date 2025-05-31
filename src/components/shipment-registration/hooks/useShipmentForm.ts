
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShipmentFormData } from '../types';

export const useShipmentForm = (onBack: () => void) => {
  const { toast } = useToast();
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

  // Check if pickup date allows actual entry
  useEffect(() => {
    if (formData.pickupDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pickupDate = new Date(formData.pickupDate);
      pickupDate.setHours(0, 0, 0, 0);
      
      setCanEnterActuals(pickupDate <= today);
    } else {
      setCanEnterActuals(false);
    }
  }, [formData.pickupDate]);

  const validateGblNumber = (gblNumber: string): boolean => {
    const gblPattern = /^[A-Z]{4}\d{7}$/;
    return gblPattern.test(gblNumber);
  };

  const handleInputChange = (field: string, value: string) => {
    // Auto-capitalize GBL number
    if (field === 'gblNumber') {
      value = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.pickupDate) {
      toast({
        title: "Error",
        description: "Pickup Date is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.rdd) {
      toast({
        title: "Error", 
        description: "Required Delivery Date (RDD) is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gblNumber || !formData.shipperLastName || !formData.shipmentType || !formData.tspId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate GBL number format
    if (!validateGblNumber(formData.gblNumber)) {
      toast({
        title: "Error",
        description: "GBL Number must be in format XXXX9999999 (4 letters followed by 7 digits).",
        variant: "destructive",
      });
      return;
    }

    // Validate pieces and volume logic
    const hasEstimated = formData.estimatedPieces || formData.estimatedCube;
    const hasActual = formData.actualPieces || formData.actualCube;

    if (hasEstimated && hasActual) {
      toast({
        title: "Error",
        description: "Please enter values in EITHER estimated OR actual fields, not both.",
        variant: "destructive",
      });
      return;
    }

    if (!hasEstimated && !hasActual) {
      toast({
        title: "Error",
        description: "Please enter both pieces and volume in either estimated or actual fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate that both pieces and volume are provided for the chosen type
    if (hasEstimated && (!formData.estimatedPieces || !formData.estimatedCube)) {
      toast({
        title: "Error",
        description: "Please enter both estimated pieces and estimated volume.",
        variant: "destructive",
      });
      return;
    }

    if (hasActual && (!formData.actualPieces || !formData.actualCube)) {
      toast({
        title: "Error",
        description: "Please enter both actual pieces and actual volume.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to register a shipment.",
          variant: "destructive",
        });
        return;
      }

      const shipmentData = {
        user_id: user.id,
        gbl_number: formData.gblNumber,
        shipper_last_name: formData.shipperLastName,
        pickup_date: format(formData.pickupDate, 'yyyy-MM-dd'),
        rdd: format(formData.rdd, 'yyyy-MM-dd'),
        shipment_type: formData.shipmentType as 'inbound' | 'outbound' | 'intertheater',
        origin_rate_area: formData.originRateArea || null,
        destination_rate_area: formData.destinationRateArea || null,
        target_poe_id: formData.targetPoeId || null,
        target_pod_id: formData.targetPodId || null,
        tsp_id: formData.tspId || null,
        estimated_pieces: formData.estimatedPieces ? parseFloat(formData.estimatedPieces) : null,
        estimated_cube: formData.estimatedCube ? parseFloat(formData.estimatedCube) : null,
        actual_pieces: formData.actualPieces ? parseFloat(formData.actualPieces) : null,
        actual_cube: formData.actualCube ? parseFloat(formData.actualCube) : null
      };

      const { error } = await supabase
        .from('shipments')
        .insert([shipmentData]);

      if (error) {
        console.error('Shipment registration error:', error);
        toast({
          title: "Error",
          description: "Failed to register shipment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Shipment Registered",
        description: "Your shipment has been successfully added to the system.",
      });
      onBack();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
