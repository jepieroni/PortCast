
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ShipmentFormData } from '../types';

interface DateFieldsProps {
  formData: ShipmentFormData;
  onDateChange: (field: string, date: Date | undefined) => void;
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

export const DateFields = ({
  formData,
  onDateChange
}: DateFieldsProps) => {
  const handleDateInputChange = (field: string, value: string) => {
    if (value === '') {
      onDateChange(field, undefined);
      return;
    }
    
    const parsedDate = parseDateString(value);
    if (parsedDate) {
      onDateChange(field, parsedDate);
    }
  };

  const handleDateInputBlur = (field: string, value: string) => {
    // On blur, try to parse and format the date
    const parsedDate = parseDateString(value);
    if (parsedDate) {
      onDateChange(field, parsedDate);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="pickupDate">Pickup Date *</Label>
        <div className="flex gap-2">
          <Input
            placeholder="MM/DD/YY"
            value={formatDateForInput(formData.pickupDate)}
            onChange={(e) => handleDateInputChange('pickupDate', e.target.value)}
            onBlur={(e) => handleDateInputBlur('pickupDate', e.target.value)}
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
                selected={formData.pickupDate}
                onSelect={(date) => onDateChange('pickupDate', date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="rdd">Required Delivery Date (RDD) *</Label>
        <div className="flex gap-2">
          <Input
            placeholder="MM/DD/YY"
            value={formatDateForInput(formData.rdd)}
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
                selected={formData.rdd}
                onSelect={(date) => onDateChange('rdd', date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
