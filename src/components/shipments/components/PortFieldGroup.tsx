
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Port {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface PortFieldGroupProps {
  formData: {
    target_poe_id: string;
    target_pod_id: string;
  };
  ports: Port[];
  onInputChange: (field: string, value: string) => void;
  hasFieldError?: (field: string) => boolean;
}

export const PortFieldGroup = ({ formData, ports, onInputChange, hasFieldError }: PortFieldGroupProps) => {
  return (
    <>
      <div>
        <Label htmlFor="target_poe_id">Port of Embarkation *</Label>
        <Select value={formData.target_poe_id} onValueChange={(value) => onInputChange('target_poe_id', value)}>
          <SelectTrigger className={cn(hasFieldError?.('target_poe_id') && "border-red-500 focus:border-red-500")}>
            <SelectValue placeholder="Select POE" />
          </SelectTrigger>
          <SelectContent>
            {ports.map((port) => (
              <SelectItem key={port.id} value={port.id}>
                {port.code} - {port.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="target_pod_id">Port of Debarkation *</Label>
        <Select value={formData.target_pod_id} onValueChange={(value) => onInputChange('target_pod_id', value)}>
          <SelectTrigger className={cn(hasFieldError?.('target_pod_id') && "border-red-500 focus:border-red-500")}>
            <SelectValue placeholder="Select POD" />
          </SelectTrigger>
          <SelectContent>
            {ports.map((port) => (
              <SelectItem key={port.id} value={port.id}>
                {port.code} - {port.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
