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

  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => {
      if (!id) throw new Error('Shipment ID is required');
      
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

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const handleFormSubmit = async (formData: any) => {
    if (!id) return;
    
    console.log('Form data being submitted:', formData);
    
    try {
      await updateShipment(id, formData);
      // Navigate back to main dashboard and then to shipments
      navigate('/', { state: { navigateTo: 'shipments' } });
    } catch (error) {
      console.error('Error updating shipment:', error);
    }
  };

  const handleCancel = () => {
    // Navigate back to main dashboard and then to shipments
    navigate('/', { state: { navigateTo: 'shipments' } });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !shipment) {
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
            <p className="text-red-600">
              {error ? 'Error loading shipment data' : 'Shipment not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
