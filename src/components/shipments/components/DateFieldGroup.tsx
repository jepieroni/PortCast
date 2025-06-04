
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateFieldGroupProps {
  pickupInputValue: string;
  rddInputValue: string;
  formData: {
    pickup_date: string;
    rdd: string;
  };
  onDateInputChange: (field: string, value: string) => void;
  onDateInputBlur: (field: string) => void;
  onDateSelect: (field: string, date: Date | undefined) => void;
  hasFieldError?: (field: string) => boolean;
}

export const DateFieldGroup = ({
  pickupInputValue,
  rddInputValue,
  formData,
  onDateInputChange,
  onDateInputBlur,
  onDateSelect,
  hasFieldError
}: DateFieldGroupProps) => {
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const pickupDate = parseDate(formData.pickup_date);
  const rddDate = parseDate(formData.rdd);

  return (
    <>
      <div>
        <Label htmlFor="pickup_date">Pickup Date *</Label>
        <div className="flex gap-2">
          <Input
            id="pickup_date"
            type="date"
            value={formData.pickup_date || ''}
            onChange={(e) => onDateInputChange('pickup_date', e.target.value)}
            onBlur={() => onDateInputBlur('pickup_date')}
            className={cn("flex-1", hasFieldError?.('pickup_date') && "border-red-500 focus:border-red-500")}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="px-3">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={pickupDate}
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
            id="rdd"
            type="date"
            value={formData.rdd || ''}
            onChange={(e) => onDateInputChange('rdd', e.target.value)}
            onBlur={() => onDateInputBlur('rdd')}
            className={cn("flex-1", hasFieldError?.('rdd') && "border-red-500 focus:border-red-500")}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="px-3">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={rddDate}
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
