
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DateFieldGroupProps {
  pickupInputValue: string;
  rddInputValue: string;
  formData: {
    pickup_date: string;
    rdd: string;
  };
  onDateInputChange: (field: string, value: string) => void;
  onDateInputBlur: (field: string, value: string) => void;
  onDateSelect: (field: string, date: Date | undefined) => void;
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

export const DateFieldGroup = ({
  pickupInputValue,
  rddInputValue,
  formData,
  onDateInputChange,
  onDateInputBlur,
  onDateSelect
}: DateFieldGroupProps) => {
  return (
    <>
      <div>
        <Label htmlFor="pickup_date">Pickup Date *</Label>
        <div className="flex gap-2">
          <Input
            placeholder="MM/DD/YY"
            value={pickupInputValue}
            onChange={(e) => onDateInputChange('pickup_date', e.target.value)}
            onBlur={(e) => onDateInputBlur('pickup_date', e.target.value)}
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
                onSelect={(date) => onDateSelect('pickup_date', date)}
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
            onChange={(e) => onDateInputChange('rdd', e.target.value)}
            onBlur={(e) => onDateInputBlur('rdd', e.target.value)}
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
                onSelect={(date) => onDateSelect('rdd', date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
};
