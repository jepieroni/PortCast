
import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ShipmentFormData } from '../types';
import { FormField } from './FormField';

interface DateFieldsProps {
  formData: ShipmentFormData;
  onDateChange: (field: string, date: Date | undefined) => void;
  pickupError?: string;
  rddError?: string;
  onFieldFocus?: (field: string) => void;
  setFieldRef?: (field: string, ref: HTMLDivElement | null) => void;
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

const formatDateForInput = (date: Date | undefined): string => {
  if (!date) return '';
  return format(date, 'MM/dd/yy');
};

const DateFieldWithPicker = forwardRef<HTMLDivElement, {
  label: string;
  field: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
  onFieldFocus?: () => void;
}>(({ label, field, value, onChange, error, onFieldFocus }, ref) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(formatDateForInput(value));
  }, [value]);

  const handleDateInputChange = (inputValue: string) => {
    setInputValue(inputValue);

    if (inputValue === '') {
      onChange(undefined);
      return;
    }
    
    const parsedDate = parseDateString(inputValue);
    if (parsedDate) {
      onChange(parsedDate);
    }
  };

  const handleDateInputBlur = (inputValue: string) => {
    const parsedDate = parseDateString(inputValue);
    if (parsedDate) {
      onChange(parsedDate);
      setInputValue(formatDateForInput(parsedDate));
    }
  };

  return (
    <FormField
      ref={ref}
      type="custom"
      label={label}
      required
      error={error}
    >
      <div className="flex gap-2">
        <Input
          placeholder="MM/DD/YY"
          value={inputValue}
          onChange={(e) => handleDateInputChange(e.target.value)}
          onBlur={(e) => handleDateInputBlur(e.target.value)}
          onFocus={onFieldFocus}
          className={cn("flex-1", error && "border-red-500 focus:border-red-500")}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              type="button"
              onClick={onFieldFocus}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={onChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </FormField>
  );
});

DateFieldWithPicker.displayName = 'DateFieldWithPicker';

export const DateFields = ({
  formData,
  onDateChange,
  pickupError,
  rddError,
  onFieldFocus,
  setFieldRef
}: DateFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <DateFieldWithPicker
        ref={(ref) => setFieldRef?.('pickupDate', ref)}
        label="Pickup Date"
        field="pickupDate"
        value={formData.pickupDate}
        onChange={(date) => onDateChange('pickupDate', date)}
        error={pickupError}
        onFieldFocus={() => onFieldFocus?.('pickupDate')}
      />
      
      <DateFieldWithPicker
        ref={(ref) => setFieldRef?.('rdd', ref)}
        label="Required Delivery Date (RDD)"
        field="rdd"
        value={formData.rdd}
        onChange={(date) => onDateChange('rdd', date)}
        error={rddError}
        onFieldFocus={() => onFieldFocus?.('rdd')}
      />
    </div>
  );
};
