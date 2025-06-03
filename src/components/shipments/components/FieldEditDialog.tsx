
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FieldEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  field: string;
  onSuccess: () => void;
}

const FieldEditDialog = ({ isOpen, onClose, record, field, onSuccess }: FieldEditDialogProps) => {
  const { toast } = useToast();
  const [value, setValue] = useState(record?.[field] || '');
  const [date, setDate] = useState<Date | undefined>(
    record?.[field] ? new Date(record[field]) : undefined
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch reference data based on field type
  const { data: ports = [] } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ports')
        .select('id, code, name')
        .order('code');
      if (error) throw error;
      return data;
    },
    enabled: isOpen && (field === 'raw_poe_code' || field === 'raw_pod_code')
  });

  const { data: rateAreas = [] } = useQuery({
    queryKey: ['rate_areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_areas')
        .select('rate_area, name, countries(name)')
        .order('rate_area');
      if (error) throw error;
      return data;
    },
    enabled: isOpen && (field === 'raw_origin_rate_area' || field === 'raw_destination_rate_area')
  });

  const { data: tsps = [] } = useQuery({
    queryKey: ['tsps'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();
      
      const { data, error } = await supabase
        .from('tsps')
        .select('id, name, scac_code')
        .eq('organization_id', profile!.organization_id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen && field === 'raw_scac_code'
  });

  const getFieldLabel = () => {
    const labels = {
      'gbl_number': 'GBL Number',
      'shipper_last_name': 'Shipper Last Name',
      'shipment_type': 'Shipment Type',
      'raw_origin_rate_area': 'Origin Rate Area',
      'raw_destination_rate_area': 'Destination Rate Area',
      'raw_poe_code': 'POE Code',
      'raw_pod_code': 'POD Code',
      'raw_scac_code': 'SCAC Code',
      'pickup_date': 'Pickup Date',
      'rdd': 'Required Delivery Date',
      'estimated_cube': 'Estimated Cube',
      'actual_cube': 'Actual Cube'
    };
    return labels[field as keyof typeof labels] || field;
  };

  const handleUpdate = async () => {
    if (!record) return;

    setIsUpdating(true);
    try {
      let updateValue = value;
      
      // Handle date fields
      if ((field === 'pickup_date' || field === 'rdd') && date) {
        updateValue = format(date, 'yyyy-MM-dd');
      }

      // Handle numeric fields
      if (field === 'estimated_cube' || field === 'actual_cube') {
        updateValue = parseInt(value) || 0;
      }

      const { error } = await supabase
        .from('shipment_uploads_staging')
        .update({
          [field]: updateValue,
          validation_status: 'pending', // Reset validation status
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Field updated",
        description: `${getFieldLabel()} has been updated successfully`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update field",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const renderFieldInput = () => {
    // Date fields
    if (field === 'pickup_date' || field === 'rdd') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'yyyy-MM-dd') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    // Shipment type
    if (field === 'shipment_type') {
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select shipment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I">Inbound</SelectItem>
            <SelectItem value="O">Outbound</SelectItem>
            <SelectItem value="T">Intertheater</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Port fields
    if (field === 'raw_poe_code' || field === 'raw_pod_code') {
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select or enter port code" />
          </SelectTrigger>
          <SelectContent>
            {ports.map((port) => (
              <SelectItem key={port.id} value={port.code}>
                {port.code} - {port.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Rate area fields
    if (field === 'raw_origin_rate_area' || field === 'raw_destination_rate_area') {
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select or enter rate area" />
          </SelectTrigger>
          <SelectContent>
            {rateAreas.map((area) => (
              <SelectItem key={area.rate_area} value={area.rate_area}>
                {area.rate_area} - {area.name || 'No name'} ({area.countries?.name || 'Unknown'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // SCAC code
    if (field === 'raw_scac_code') {
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select or enter SCAC code" />
          </SelectTrigger>
          <SelectContent>
            {tsps.map((tsp) => (
              <SelectItem key={tsp.id} value={tsp.scac_code}>
                {tsp.scac_code} - {tsp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Default text input
    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Enter ${getFieldLabel().toLowerCase()}`}
      />
    );
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {getFieldLabel()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{getFieldLabel()}</Label>
            {renderFieldInput()}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Field'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FieldEditDialog;
