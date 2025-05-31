
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShipmentFormData, TSP } from '../types';

interface BasicInfoFieldsProps {
  formData: ShipmentFormData;
  tsps: TSP[];
  onInputChange: (field: string, value: string) => void;
}

export const BasicInfoFields = ({
  formData,
  tsps,
  onInputChange
}: BasicInfoFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="tspId">TSP/SCAC *</Label>
        <Select value={formData.tspId} onValueChange={(value) => onInputChange('tspId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select TSP" />
          </SelectTrigger>
          <SelectContent>
            {tsps.map((tsp) => (
              <SelectItem key={tsp.id} value={tsp.id}>
                {tsp.scac_code} - {tsp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gblNumber">GBL Number *</Label>
          <Input
            id="gblNumber"
            value={formData.gblNumber}
            onChange={(e) => onInputChange('gblNumber', e.target.value)}
            placeholder="XXXX9999999 (4 letters + 7 digits)"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="shipperLastName">Shipper Last Name *</Label>
          <Input
            id="shipperLastName"
            value={formData.shipperLastName}
            onChange={(e) => onInputChange('shipperLastName', e.target.value)}
            placeholder="Last name of shipper"
            required
          />
        </div>
      </div>
    </>
  );
};
