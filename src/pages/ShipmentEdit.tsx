
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ShipmentEditForm } from '@/components/shipments/components/ShipmentEditForm';
import { useShipmentActions } from '@/hooks/useShipmentActions';
import LoadingScreen from '@/components/LoadingScreen';

const ShipmentEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateShipment } = useShipmentActions();

  console.log('ShipmentEdit - Component mounted with ID:', id);

  const { data: shipment, isLoading, error, refetch } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => {
      if (!id) {
        console.error('ShipmentEdit - No shipment ID provided');
        throw new Error('Shipment ID is required');
      }
      
      console.log('ShipmentEdit - Fetching shipment data for ID:', id);
      
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          tsp:tsps(id, name, scac_code),
          target_poe:ports!target_poe_id(id, name, code),
          target_pod:ports!target_pod_id(id, name, code)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('ShipmentEdit - Database error:', error);
        throw error;
      }
      
      console.log('ShipmentEdit - Successfully fetched shipment data:', data);
      return data;
    },
    enabled: !!id,
    retry: 3,
    retryDelay: 1000,
  });

  console.log('ShipmentEdit - Current state:', { 
    id, 
    isLoading, 
    hasData: !!shipment, 
    error: error?.message,
    shipmentGBL: shipment?.gbl_number 
  });

  const handleFormSubmit = async (formData: any) => {
    if (!id) {
      console.error('ShipmentEdit - Cannot submit: No shipment ID');
      return;
    }
    
    console.log('ShipmentEdit - Form data being submitted:', formData);
    
    try {
      await updateShipment(id, formData);
      console.log('ShipmentEdit - Update successful, navigating back');
      navigate('/', { state: { navigateTo: 'shipments' } });
    } catch (error) {
      console.error('ShipmentEdit - Error updating shipment:', error);
    }
  };

  const handleCancel = () => {
    console.log('ShipmentEdit - Cancel clicked, navigating back');
    navigate('/', { state: { navigateTo: 'shipments' } });
  };

  if (isLoading) {
    console.log('ShipmentEdit - Showing loading screen');
    return <LoadingScreen />;
  }

  if (error || !shipment) {
    console.error('ShipmentEdit - Error state or no shipment:', { error, hasShipment: !!shipment });
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold">Edit Shipment</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-red-600">
                {error ? `Error loading shipment data: ${error.message}` : 'Shipment not found'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('ShipmentEdit - Rendering form with shipment:', shipment.gbl_number);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Edit Shipment - {shipment.gbl_number}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentEditForm
            key={shipment.id} // Force re-render when shipment changes
            shipment={shipment}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentEdit;
