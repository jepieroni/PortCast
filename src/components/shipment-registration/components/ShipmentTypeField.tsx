
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShipmentFormData } from '../types';

interface ShipmentTypeFieldProps {
  formData: ShipmentFormData;
  onShipmentTypeChange: (value: string) => void;
}

export const ShipmentTypeField = ({
  formData,
  onShipmentTypeChange
}: ShipmentTypeFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="shipmentType">Shipment Type *</Label>
      <Select value={formData.shipmentType} onValueChange={onShipmentTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select shipment type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inbound">Inbound (OCONUS to CONUS)</SelectItem>
          <SelectItem value="outbound">Outbound (CONUS to OCONUS)</SelectItem>
          <SelectItem value="intertheater">Intertheater (OCONUS to OCONUS)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
