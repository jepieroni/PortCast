
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft, Save } from 'lucide-react';
import { useShipmentData } from './shipment-registration/hooks/useShipmentData';
import { useShipmentForm } from './shipment-registration/hooks/useShipmentForm';
import { ShipmentFormFields } from './shipment-registration/components/ShipmentFormFields';
import { VolumeFields } from './shipment-registration/components/VolumeFields';
import { SidebarCards } from './shipment-registration/components/SidebarCards';

interface ShipmentRegistrationProps {
  onBack: () => void;
}

const ShipmentRegistration = ({ onBack }: ShipmentRegistrationProps) => {
  const { rateAreas, ports, tsps } = useShipmentData();
  const { formData, canEnterActuals, handleInputChange, handleDateChange, handleSubmit } = useShipmentForm(onBack);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold">Shipment Registration</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Add New Shipment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <ShipmentFormFields
                    formData={formData}
                    rateAreas={rateAreas}
                    ports={ports}
                    tsps={tsps}
                    canEnterActuals={canEnterActuals}
                    onInputChange={handleInputChange}
                    onDateChange={handleDateChange}
                  />

                  <VolumeFields
                    formData={formData}
                    canEnterActuals={canEnterActuals}
                    onInputChange={handleInputChange}
                  />

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save size={16} className="mr-2" />
                    Register Shipment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <SidebarCards />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ShipmentRegistration;
