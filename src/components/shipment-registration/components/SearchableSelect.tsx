
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface SearchableSelectOption {
  value: string;
  label: string;
  searchableText?: string;
}

interface SearchableSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: SearchableSelectOption[];
  error?: string;
  onFocus?: () => void;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({ label, required, value, onChange, placeholder, options, error, onFocus, className, disabled }, ref) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const selectedOption = options.find(option => option.value === value);

    const filteredOptions = options.filter(option => {
      const searchText = (option.searchableText || option.label).toLowerCase();
      return searchText.includes(searchValue.toLowerCase());
    });

    const handleSelect = (selectedValue: string) => {
      console.log('Option selected:', selectedValue);
      onChange(selectedValue === value ? '' : selectedValue);
      setOpen(false);
      setSearchValue('');
    };

    const handleOpenChange = (isOpen: boolean) => {
      if (disabled) return;
      
      console.log('SearchableSelect open change:', isOpen);
      setOpen(isOpen);
      if (isOpen && onFocus) {
        onFocus();
      }
      if (!isOpen) {
        setSearchValue('');
      }
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <Label className={cn(error && "text-red-600")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              type="button"
              disabled={disabled}
              className={cn(
                "w-full justify-between",
                error && "border-red-500 focus:border-red-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 z-[10000] bg-white border shadow-2xl pointer-events-auto" 
            align="start"
            side="bottom"
            sideOffset={4}
            style={{ pointerEvents: 'auto' }}
            onOpenAutoFocus={(e) => {
              // Don't prevent auto focus - let it work naturally
            }}
          >
            <div className="pointer-events-auto">
              <div className="flex items-center border-b px-3 pointer-events-auto">
                <Input
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="h-9 border-0 focus:ring-0 focus:outline-none bg-transparent pointer-events-auto"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto pointer-events-auto">
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm pointer-events-auto">No results found.</div>
                ) : (
                  <div className="p-1 pointer-events-auto">
                    {filteredOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground pointer-events-auto"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';
