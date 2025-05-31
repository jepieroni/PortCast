
import { useToast } from '@/hooks/use-toast';
import { ShipmentFormData } from '../types';
import { validateGblNumber } from '../utils/shipmentUtils';

export const useShipmentValidation = () => {
  const { toast } = useToast();

  const validateForm = (formData: ShipmentFormData): boolean => {
    // Validate required fields
    if (!formData.pickupDate) {
      toast({
        title: "Error",
        description: "Pickup Date is required.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.rdd) {
      toast({
        title: "Error", 
        description: "Required Delivery Date (RDD) is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.gblNumber || !formData.shipperLastName || !formData.shipmentType || !formData.tspId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    // Validate GBL number format
    if (!validateGblNumber(formData.gblNumber)) {
      toast({
        title: "Error",
        description: "GBL Number must be in format XXXX9999999 (4 letters followed by 7 digits).",
        variant: "destructive",
      });
      return false;
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
      return false;
    }

    if (!hasEstimated && !hasActual) {
      toast({
        title: "Error",
        description: "Please enter both pieces and volume in either estimated or actual fields.",
        variant: "destructive",
      });
      return false;
    }

    // Validate that both pieces and volume are provided for the chosen type
    if (hasEstimated && (!formData.estimatedPieces || !formData.estimatedCube)) {
      toast({
        title: "Error",
        description: "Please enter both estimated pieces and estimated volume.",
        variant: "destructive",
      });
      return false;
    }

    if (hasActual && (!formData.actualPieces || !formData.actualCube)) {
      toast({
        title: "Error",
        description: "Please enter both actual pieces and actual volume.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return { validateForm };
};
