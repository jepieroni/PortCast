
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicFieldsProps {
  formData: {
    gbl_number: string;
    shipper_last_name: string;
    shipment_type: string;
    origin_rate_area: string;
    destination_rate_area: string;
  };
  rateAreas: any[];
  onInputChange: (field: string, value: string) => void;
}

export const BasicFields = ({ formData, rateAreas, onInputChange }: BasicFieldsProps) => {
  console.log('BasicFields formData:', formData);
  console.log('Available rate areas:', rateAreas);

  // Only allow changes if we have data to work with, and don't clear existing values
  const handleSelectChange = (field: string, value: string) => {
    // Don't clear existing values if we don't have rate areas loaded yet
    if (!value && rateAreas.length === 0 && formData[field as keyof typeof formData]) {
      console.log(`BasicFields - Preventing clear of ${field} while rate areas are loading`);
      return;
    }
    console.log(`BasicFields - Select change: ${field} = "${value}"`);
    onInputChange(field, value);
  };

  return (
    <>
      <div>
        <Label htmlFor="gbl_number">GBL Number *</Label>
        <Input
          id="gbl_number"
          value={formData.gbl_number}
          onChange={(e) => onInputChange('gbl_number', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="shipper_last_name">Shipper Last Name *</Label>
        <Input
          id="shipper_last_name"
          value={formData.shipper_last_name}
          onChange={(e) => onInputChange('shipper_last_name', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="shipment_type">Shipment Type *</Label>
        <Select 
          value={formData.shipment_type} 
          onValueChange={(value) => handleSelectChange('shipment_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="intertheater">Intertheater</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="origin_rate_area">Origin Rate Area *</Label>
        <Select 
          value={formData.origin_rate_area} 
          onValueChange={(value) => handleSelectChange('origin_rate_area', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select origin" />
          </SelectTrigger>
          <SelectContent>
            {rateAreas?.map((area) => (
              <SelectItem key={area.id} value={area.rate_area}>
                {area.rate_area} - {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="destination_rate_area">Destination Rate Area *</Label>
        <Select 
          value={formData.destination_rate_area} 
          onValueChange={(value) => handleSelectChange('destination_rate_area', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {rateAreas?.map((area) => (
              <SelectItem key={area.id} value={area.rate_area}>
                {area.rate_area} - {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
