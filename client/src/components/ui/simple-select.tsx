import React, { ChangeEvent } from 'react';
import { cn } from "@/lib/utils";

export interface SimpleSelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  options: SimpleSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  value?: string;
  className?: string;
  disabled?: boolean;
}

const SimpleSelect = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className, options, placeholder, onChange, value, disabled, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    };
    
    return (
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        value={value}
        onChange={handleChange}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

SimpleSelect.displayName = "SimpleSelect";

export { SimpleSelect };