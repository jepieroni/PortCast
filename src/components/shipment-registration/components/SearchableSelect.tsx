
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
}

export const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({ label, required, value, onChange, placeholder, options, error, onFocus, className }, ref) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const selectedOption = options.find(option => option.value === value);

    const filteredOptions = options.filter(option => {
      const searchText = (option.searchableText || option.label).toLowerCase();
      return searchText.includes(searchValue.toLowerCase());
    });

    const handleSelect = (selectedValue: string) => {
      onChange(selectedValue === value ? '' : selectedValue);
      setOpen(false);
      setSearchValue('');
    };

    const handleOpenChange = (isOpen: boolean) => {
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
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                error && "border-red-500 focus:border-red-500"
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
