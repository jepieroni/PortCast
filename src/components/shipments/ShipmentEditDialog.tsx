import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useShipmentActions } from '@/hooks/useShipmentActions';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { SearchableSelect } from '@/components/shipment-registration/components/SearchableSelect';

interface ShipmentEditDialogProps {
  shipment: any;
  onClose: () => void;
  onSuccess: () => void;
}

const parseDateString = (dateStr: string): Date | null => {
  // Remove any non-digit characters except /
  const cleaned = dateStr.replace(/[^\d\/]/g, '');
  
  // Check for MM/DD/YY or MM/DD/YYYY format
  const mmddyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  const match = cleaned.match(mmddyyPattern);
  
  if (match) {
    let [, month, day, year] = match;
    
    // Convert 2-digit year to 4-digit year
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const yearNum = parseInt(year);
      
      // If year is less than 50, assume 20xx, otherwise 19xx
      if (yearNum < 50) {
        year = (currentCentury + yearNum).toString();
      } else {
        year = (currentCentury - 100 + yearNum).toString();
      }
    }
    
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate the date
    if (parsedDate.getMonth() === parseInt(month) - 1 && 
        parsedDate.getDate() === parseInt(day) &&
        parsedDate.getFullYear() === parseInt(year)) {
      return parsedDate;
    }
  }
  
  return null;
};

const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return format(date, 'MM/dd/yy');
};

const ShipmentEditDialog = ({ shipment, onClose, onSuccess }: ShipmentEditDialogProps) => {
  const { updateShipment } = useShipmentActions();
  const { rateAreas, ports, tsps } = useShipmentData();
  const [formData, setFormData] = useState({
    gbl_number: '',
    shipper_last_name: '',
    shipment_type: '',
    origin_rate_area: '',
    destination_rate_area: '',
    pickup_date: '',
    rdd: '',
    estimated_cube: '',
    actual_cube: '',
    remaining_cube: '',
    estimated_pieces: '',
    actual_pieces: '',
    remaining_pieces: '',
    target_poe_id: '',
    target_pod_id: '',
    tsp_id: '',
  });

  // Local state for date input values
  const [pickupInputValue, setPickupInputValue] = useState('');
  const [rddInputValue, setRddInputValue] = useState('');

  useEffect(() => {
    if (shipment) {
      console.log('Shipment data for editing:', shipment);
      const newFormData = {
        gbl_number: shipment.gbl_number || '',
        shipper_last_name: shipment.shipper_last_name || '',
        shipment_type: shipment.shipment_type || '',
        origin_rate_area: shipment.origin_rate_area || '',
        destination_rate_area: shipment.destination_rate_area || '',
        pickup_date: shipment.pickup_date || '',
        rdd: shipment.rdd || '',
        estimated_cube: shipment.estimated_cube?.toString() || '',
        actual_cube: shipment.actual_cube?.toString() || '',
        remaining_cube: shipment.remaining_cube?.toString() || '',
        estimated_pieces: shipment.estimated_pieces?.toString() || '',
        actual_pieces: shipment.actual_pieces?.toString() || '',
        remaining_pieces: shipment.remaining_pieces?.toString() || '',
        target_poe_id: shipment.target_poe_id || '',
        target_pod_id: shipment.target_pod_id || '',
        tsp_id: shipment.tsp_id || '',
      };
      setFormData(newFormData);
      
      // Initialize date input values
      setPickupInputValue(formatDateForInput(newFormData.pickup_date));
      setRddInputValue(formatDateForInput(newFormData.rdd));
    }
  }, [shipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateShipment(shipment.id, formData);
      onSuccess();
    } catch (error) {
      console.error('Error updating shipment:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateInputChange = (field: string, value: string) => {
    // Always update the input value to allow typing
    if (field === 'pickup_date') {
      setPickupInputValue(value);
    } else if (field === 'rdd') {
      setRddInputValue(value);
    }

    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    const parsedDate = parseDateString(value);
    if (parsedDate) {
      setFormData(prev => ({ ...prev, [field]: parsedDate.toISOString().split('T')[0] }));
    }
  };

  const handleDateInputBlur = (field: string, value: string) => {
    // On blur, try to parse and format the date
    const parsedDate = parseDateString(value);
    if (parsedDate) {
      const isoDate = parsedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [field]: isoDate }));
      
      // Update input to show formatted version
      const formatted = format(parsedDate, 'MM/dd/yy');
      if (field === 'pickup_date') {
        setPickupInputValue(formatted);
      } else if (field === 'rdd') {
        setRddInputValue(formatted);
      }
    }
  };

  const handleDateSelect = (field: string, date: Date | undefined) => {
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [field]: isoDate }));
      
      // Update input value to show formatted date
      const formatted = format(date, 'MM/dd/yy');
      if (field === 'pickup_date') {
        setPickupInputValue(formatted);
      } else if (field === 'rdd') {
        setRddInputValue(formatted);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: '' }));
      if (field === 'pickup_date') {
        setPickupInputValue('');
      } else if (field === 'rdd') {
        setRddInputValue('');
      }
    }
  };

  // Create searchable port options with enhanced search text
  const portOptions = ports?.map(port => ({
    value: port.id,
    label: `${port.code} - ${port.name}`,
    searchableText: `${port.code} ${port.name} ${port.description || ''}`.toLowerCase()
  })) || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipment - {shipment?.gbl_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gbl_number">GBL Number *</Label>
              <Input
                id="gbl_number"
                value={formData.gbl_number}
                onChange={(e) => handleInputChange('gbl_number', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="shipper_last_name">Shipper Last Name *</Label>
              <Input
                id="shipper_last_name"
                value={formData.shipper_last_name}
                onChange={(e) => handleInputChange('shipper_last_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="shipment_type">Shipment Type *</Label>
              <Select value={formData.shipment_type} onValueChange={(value) => handleInputChange('shipment_type', value)}>
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
              <Label htmlFor="tsp_id">TSP *</Label>
              <Select value={formData.tsp_id} onValueChange={(value) => handleInputChange('tsp_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select TSP" />
                </SelectTrigger>
                <SelectContent>
                  {tsps?.map((tsp) => (
                    <SelectItem key={tsp.id} value={tsp.id}>
                      {tsp.scac_code} - {tsp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickup_date">Pickup Date *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="MM/DD/YY"
                  value={pickupInputValue}
                  onChange={(e) => handleDateInputChange('pickup_date', e.target.value)}
                  onBlur={(e) => handleDateInputBlur('pickup_date', e.target.value)}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      type="button"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.pickup_date ? new Date(formData.pickup_date) : undefined}
                      onSelect={(date) => handleDateSelect('pickup_date', date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="rdd">Required Delivery Date *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="MM/DD/YY"
                  value={rddInputValue}
                  onChange={(e) => handleDateInputChange('rdd', e.target.value)}
                  onBlur={(e) => handleDateInputBlur('rdd', e.target.value)}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      type="button"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.rdd ? new Date(formData.rdd) : undefined}
                      onSelect={(date) => handleDateSelect('rdd', date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="origin_rate_area">Origin Rate Area *</Label>
              <Select value={formData.origin_rate_area} onValueChange={(value) => handleInputChange('origin_rate_area', value)}>
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
              <Select value={formData.destination_rate_area} onValueChange={(value) => handleInputChange('destination_rate_area', value)}>
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

            <SearchableSelect
              label="Port of Embarkation (POE)"
              required
              value={formData.target_poe_id}
              onChange={(value) => handleInputChange('target_poe_id', value)}
              placeholder="Search and select POE"
              options={portOptions}
              error=""
              onFocus={() => {}}
            />

            <SearchableSelect
              label="Port of Debarkation (POD)"
              required
              value={formData.target_pod_id}
              onChange={(value) => handleInputChange('target_pod_id', value)}
              placeholder="Search and select POD"
              options={portOptions}
              error=""
              onFocus={() => {}}
            />

            <div>
              <Label htmlFor="estimated_pieces">Estimated Pieces</Label>
              <Input
                id="estimated_pieces"
                type="number"
                style={{ appearance: 'textfield' }}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={formData.estimated_pieces}
                onChange={(e) => handleInputChange('estimated_pieces', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="estimated_cube">Estimated Cube (ft³)</Label>
              <Input
                id="estimated_cube"
                type="number"
                style={{ appearance: 'textfield' }}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={formData.estimated_cube}
                onChange={(e) => handleInputChange('estimated_cube', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="actual_pieces">Actual Pieces</Label>
              <Input
                id="actual_pieces"
                type="number"
                style={{ appearance: 'textfield' }}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={formData.actual_pieces}
                onChange={(e) => handleInputChange('actual_pieces', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="actual_cube">Actual Cube (ft³)</Label>
              <Input
                id="actual_cube"
                type="number"
                style={{ appearance: 'textfield' }}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={formData.actual_cube}
                onChange={(e) => handleInputChange('actual_cube', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="remaining_pieces">Remaining Pieces</Label>
              <Input
                id="remaining_pieces"
                type="number"
                style={{ appearance: 'textfield' }}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={formData.remaining_pieces}
                onChange={(e) => handleInputChange('remaining_pieces', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="remaining_cube">Remaining Cube (ft³)</Label>
              <Input
                id="remaining_cube"
                type="number"
                style={{ appearance: 'textfield' }}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={formData.remaining_cube}
                onChange={(e) => handleInputChange('remaining_cube', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Shipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentEditDialog;
