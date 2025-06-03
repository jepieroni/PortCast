
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { SearchableSelect } from '@/components/shipment-registration/components/SearchableSelect';
import { useFilteredPorts } from '@/hooks/useFilteredPorts';

interface EditableFieldProps {
  record: any;
  field: string;
  label: string;
  ports: any[];
  rateAreas: any[];
  tsps: any[];
  getEditingValue: (record: any, field: string) => any;
  updateEditingValue: (recordId: string, field: string, value: any) => void;
  getFieldValidationError: (record: any, field: string) => string | null;
  hasFieldIssue: (record: any, field: string) => boolean;
  onAddPortClick: () => void;
}

const EditableField = ({
  record,
  field,
  label,
  ports,
  rateAreas,
  tsps,
  getEditingValue,
  updateEditingValue,
  getFieldValidationError,
  hasFieldIssue,
  onAddPortClick
}: EditableFieldProps) => {
  const error = getFieldValidationError(record, field);
  const isInvalid = record.validation_status === 'invalid';
  const hasIssue = hasFieldIssue(record, field);
  const value = getEditingValue(record, field);

  // For valid records or invalid records where this specific field has no issue, show read-only
  if (!isInvalid || !hasIssue) {
    // Special handling for port fields to show code - name format
    if (field === 'raw_poe_code' || field === 'raw_pod_code') {
      const port = ports.find(p => p.code === value);
      const displayValue = port ? `${port.code} - ${port.name}` : value || '-';
      return <span className="text-sm">{displayValue}</span>;
    }
    
    return (
      <span className="text-sm">
        {field === 'pickup_date' || field === 'rdd' 
          ? (value ? format(new Date(value), 'yyyy-MM-dd') : '') 
          : value || '-'}
      </span>
    );
  }

  // For invalid records where this field has an issue, show editable input
  const inputClassName = `h-8 text-xs border-red-500 bg-red-50`;

  // Date fields
  if (field === 'pickup_date' || field === 'rdd') {
    const dateValue = value ? new Date(value) : undefined;
    return (
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`h-8 text-xs justify-start ${inputClassName}`}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {dateValue ? format(dateValue, 'yyyy-MM-dd') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => updateEditingValue(record.id, field, date ? format(date, 'yyyy-MM-dd') : '')}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={14} className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Shipment type
  if (field === 'shipment_type') {
    return (
      <div className="flex items-center gap-1">
        <Select value={value} onValueChange={(val) => updateEditingValue(record.id, field, val)}>
          <SelectTrigger className={inputClassName}>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I">Inbound</SelectItem>
            <SelectItem value="O">Outbound</SelectItem>
            <SelectItem value="T">Intertheater</SelectItem>
          </SelectContent>
        </Select>
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={14} className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Port fields with SearchableSelect and Add Port option - with filtering
  if (field === 'raw_poe_code' || field === 'raw_pod_code') {
    // Get the corresponding rate area for filtering
    const rateAreaField = field === 'raw_poe_code' ? 'raw_origin_rate_area' : 'raw_destination_rate_area';
    const selectedRateArea = getEditingValue(record, rateAreaField);
    
    // Filter ports based on rate area selection
    const filteredPorts = useFilteredPorts(ports, selectedRateArea);
    
    const portOptions = filteredPorts.map(port => ({
      value: port.code,
      label: `${port.code} - ${port.name}`,
      searchableText: `${port.code} ${port.name} ${port.description || ''}`
    }));

    return (
      <div className="flex items-center gap-1">
        <div className="min-w-[180px]">
          <SearchableSelect
            label=""
            value={value}
            onChange={(val) => updateEditingValue(record.id, field, val)}
            placeholder={!selectedRateArea ? "Select rate area first" : "Search ports..."}
            options={portOptions}
            error=""
            onFocus={() => {}}
            className="w-full [&>div]:border-red-500 [&>div]:bg-red-50"
            disabled={!selectedRateArea}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddPortClick}
          className="h-8 px-2"
          title="Add new port"
        >
          <Plus size={14} />
        </Button>
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={14} className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Rate area fields
  if (field === 'raw_origin_rate_area' || field === 'raw_destination_rate_area') {
    return (
      <div className="flex items-center gap-1">
        <Select value={value} onValueChange={(val) => updateEditingValue(record.id, field, val)}>
          <SelectTrigger className={inputClassName}>
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            {rateAreas.map((area) => (
              <SelectItem key={area.rate_area} value={area.rate_area}>
                {area.rate_area} - {area.name || area.countries?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={14} className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // SCAC code
  if (field === 'raw_scac_code') {
    return (
      <div className="flex items-center gap-1">
        <Select value={value} onValueChange={(val) => updateEditingValue(record.id, field, val)}>
          <SelectTrigger className={inputClassName}>
            <SelectValue placeholder="SCAC" />
          </SelectTrigger>
          <SelectContent>
            {tsps.map((tsp) => (
              <SelectItem key={tsp.id} value={tsp.scac_code}>
                {tsp.scac_code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={14} className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Default text input
  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => updateEditingValue(record.id, field, e.target.value)}
        className={inputClassName}
        placeholder={label}
      />
      {error && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle size={14} className="text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{error}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default EditableField;
