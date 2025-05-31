
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShipmentFormData, RateArea } from '../types';

interface RateAreaFieldsProps {
  formData: ShipmentFormData;
  originRateAreas: RateArea[];
  destinationRateAreas: RateArea[];
  onInputChange: (field: string, value: string) => void;
}

export const RateAreaFields = ({
  formData,
  originRateAreas,
  destinationRateAreas,
  onInputChange
}: RateAreaFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="originRateArea">Origin Rate Area</Label>
        <Select 
          value={formData.originRateArea} 
          onValueChange={(value) => onInputChange('originRateArea', value)}
          disabled={!formData.shipmentType}
        >
          <SelectTrigger className={!formData.shipmentType ? "opacity-50 cursor-not-allowed" : ""}>
            <SelectValue placeholder={!formData.shipmentType ? "Select shipment type first" : "Select origin rate area"} />
          </SelectTrigger>
          <SelectContent>
            {originRateAreas.map((rateArea) => (
              <SelectItem key={rateArea.id} value={rateArea.rate_area}>
                {rateArea.rate_area} - {rateArea.name || rateArea.countries.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="destinationRateArea">Destination Rate Area</Label>
        <Select 
          value={formData.destinationRateArea} 
          onValueChange={(value) => onInputChange('destinationRateArea', value)}
          disabled={!formData.shipmentType}
        >
          <SelectTrigger className={!formData.shipmentType ? "opacity-50 cursor-not-allowed" : ""}>
            <SelectValue placeholder={!formData.shipmentType ? "Select shipment type first" : "Select destination rate area"} />
          </SelectTrigger>
          <SelectContent>
            {destinationRateAreas.map((rateArea) => (
              <SelectItem key={rateArea.id} value={rateArea.rate_area}>
                {rateArea.rate_area} - {rateArea.name || rateArea.countries.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
