
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface BasicFieldsProps {
  formData: {
    gbl_number: string;
    shipper_last_name: string;
    shipment_type: string;
    origin_rate_area: string;
    destination_rate_area: string;
  };
  rateAreas: Array<{
    rate_area: string;
    name?: string;
    countries?: { name: string };
  }>;
  onInputChange: (field: string, value: string) => void;
  hasFieldError?: (field: string) => boolean;
}

export const BasicFields = ({ formData, rateAreas, onInputChange, hasFieldError }: BasicFieldsProps) => {
  return (
    <>
      <div>
        <Label htmlFor="gbl_number">GBL Number *</Label>
        <Input
          id="gbl_number"
          value={formData.gbl_number}
          onChange={(e) => onInputChange('gbl_number', e.target.value)}
          className={cn(hasFieldError?.('gbl_number') && "border-red-500 focus:border-red-500")}
        />
      </div>

      <div>
        <Label htmlFor="shipper_last_name">Shipper Last Name *</Label>
        <Input
          id="shipper_last_name"
          value={formData.shipper_last_name}
          onChange={(e) => onInputChange('shipper_last_name', e.target.value)}
          className={cn(hasFieldError?.('shipper_last_name') && "border-red-500 focus:border-red-500")}
        />
      </div>

      <div>
        <Label htmlFor="shipment_type">Shipment Type *</Label>
        <Select value={formData.shipment_type} onValueChange={(value) => onInputChange('shipment_type', value)}>
          <SelectTrigger className={cn(hasFieldError?.('shipment_type') && "border-red-500 focus:border-red-500")}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inbound">inbound</SelectItem>
            <SelectItem value="outbound">outbound</SelectItem>
            <SelectItem value="intertheater">intertheater</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="origin_rate_area">Origin Rate Area *</Label>
        <Select value={formData.origin_rate_area} onValueChange={(value) => onInputChange('origin_rate_area', value)}>
          <SelectTrigger className={cn(hasFieldError?.('origin_rate_area') && "border-red-500 focus:border-red-500")}>
            <SelectValue placeholder="Select origin rate area" />
          </SelectTrigger>
          <SelectContent>
            {rateAreas.map((area) => (
              <SelectItem key={area.rate_area} value={area.rate_area}>
                {area.rate_area} - {area.name || area.countries?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="destination_rate_area">Destination Rate Area *</Label>
        <Select value={formData.destination_rate_area} onValueChange={(value) => onInputChange('destination_rate_area', value)}>
          <SelectTrigger className={cn(hasFieldError?.('destination_rate_area') && "border-red-500 focus:border-red-500")}>
            <SelectValue placeholder="Select destination rate area" />
          </SelectTrigger>
          <SelectContent>
            {rateAreas.map((area) => (
              <SelectItem key={area.rate_area} value={area.rate_area}>
                {area.rate_area} - {area.name || area.countries?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
