
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface RegistrationHeaderProps {
  onBack: () => void;
}

export const RegistrationHeader = ({ onBack }: RegistrationHeaderProps) => {
  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft size={16} className="mr-2" />
        Back to Shipments
      </Button>
      <h2 className="text-2xl font-bold">Shipment Registration</h2>
    </div>
  );
};
