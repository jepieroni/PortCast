
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShipmentFormData, Port } from '../types';

interface PortFieldsProps {
  formData: ShipmentFormData;
  ports: Port[];
  onInputChange: (field: string, value: string) => void;
}

export const PortFields = ({
  formData,
  ports,
  onInputChange
}: PortFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="targetPoeId">POE (Port of Embarkation)</Label>
        <Select value={formData.targetPoeId} onValueChange={(value) => onInputChange('targetPoeId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select POE" />
          </SelectTrigger>
          <SelectContent>
            {ports.map((port) => (
              <SelectItem key={port.id} value={port.id}>
                {port.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetPodId">POD (Port of Debarkation)</Label>
        <Select value={formData.targetPodId} onValueChange={(value) => onInputChange('targetPodId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select POD" />
          </SelectTrigger>
          <SelectContent>
            {ports.map((port) => (
              <SelectItem key={port.id} value={port.id}>
                {port.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
