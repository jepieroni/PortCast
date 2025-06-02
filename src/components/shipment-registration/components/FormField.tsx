
import React, { forwardRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'input' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  onFocus?: () => void;
}

interface CustomFieldProps extends BaseFieldProps {
  type: 'custom';
  children: React.ReactNode;
}

type FormFieldProps = InputFieldProps | SelectFieldProps | CustomFieldProps;

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>((props, ref) => {
  const { label, required, error, className } = props;

  const renderField = () => {
    if (props.type === 'select') {
      return (
        <Select value={props.value} onValueChange={props.onChange} onOpenChange={(open) => {
          if (open && props.onFocus) props.onFocus();
        }}>
          <SelectTrigger className={cn(error && "border-red-500 focus:border-red-500")}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (props.type === 'custom') {
      return props.children;
    }

    return (
      <Input
        type={props.type === 'number' ? 'number' : 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        onFocus={props.onFocus}
        className={cn(
          error && "border-red-500 focus:border-red-500",
          props.type === 'number' && "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        )}
        style={props.type === 'number' ? { appearance: 'textfield' } : undefined}
      />
    );
  };

  return (
    <div ref={ref} className={cn("space-y-2", className)}>
      <Label className={cn(error && "text-red-600")}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';
