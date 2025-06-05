
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';
import { RegistrationHeader } from './shipment-registration/components/RegistrationHeader';
import { ShipmentRegistrationForm } from './shipment-registration/components/ShipmentRegistrationForm';
import { SidebarCards } from './shipment-registration/components/SidebarCards';
import BulkShipmentUpload from './shipments/BulkShipmentUpload';

interface ShipmentRegistrationProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const ShipmentRegistration = ({ onBack, onSuccess }: ShipmentRegistrationProps) => {
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const handleBulkUploadClick = () => {
    setShowBulkUpload(true);
  };

  const handleBulkUploadBack = () => {
    setShowBulkUpload(false);
  };

  if (showBulkUpload) {
    return (
      <BulkShipmentUpload onBack={handleBulkUploadBack} />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <RegistrationHeader onBack={onBack} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ShipmentRegistrationForm onBack={onBack} onSuccess={onSuccess} />
          </div>

          <SidebarCards onBulkUploadClick={handleBulkUploadClick} />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ShipmentRegistration;
