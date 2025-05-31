
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ShipmentFormData, RateArea, TSP, Port } from '../types';

interface ShipmentFormFieldsProps {
  formData: ShipmentFormData;
  rateAreas: RateArea[];
  ports: Port[];
  tsps: TSP[];
  canEnterActuals: boolean;
  onInputChange: (field: string, value: string) => void;
  onDateChange: (field: string, date: Date | undefined) => void;
}

export const ShipmentFormFields = ({
  formData,
  rateAreas,
  ports,
  tsps,
  canEnterActuals,
  onInputChange,
  onDateChange
}: ShipmentFormFieldsProps) => {
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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupDate">Pickup Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.pickupDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.pickupDate ? format(formData.pickupDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.pickupDate}
                onSelect={(date) => onDateChange('pickupDate', date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="rdd">Required Delivery Date (RDD) *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.rdd && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.rdd ? format(formData.rdd, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.rdd}
                onSelect={(date) => onDateChange('rdd', date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipmentType">Shipment Type *</Label>
        <Select value={formData.shipmentType} onValueChange={(value) => onInputChange('shipmentType', value)}>
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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="originRateArea">Origin Rate Area</Label>
          <Select value={formData.originRateArea} onValueChange={(value) => onInputChange('originRateArea', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select origin rate area" />
            </SelectTrigger>
            <SelectContent>
              {rateAreas.map((rateArea) => (
                <SelectItem key={rateArea.id} value={rateArea.rate_area}>
                  {rateArea.rate_area} - {rateArea.name || rateArea.countries.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationRateArea">Destination Rate Area</Label>
          <Select value={formData.destinationRateArea} onValueChange={(value) => onInputChange('destinationRateArea', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination rate area" />
            </SelectTrigger>
            <SelectContent>
              {rateAreas.map((rateArea) => (
                <SelectItem key={rateArea.id} value={rateArea.rate_area}>
                  {rateArea.rate_area} - {rateArea.name || rateArea.countries.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
    </>
  );
};
