import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onEnter?: () => void;
  isError?: boolean;
  isSuccess?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, onEnter, isError, isSuccess, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);

    // Auto-focus logic can go here if needed, but usually handled by parent
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onEnter?.();
      }
      props.onKeyDown?.(e);
    };

    return (
      <input
        ref={ref || internalRef}
        type="number" // use tel for better mobile keypad? number is strictly validated
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn(
          "w-full bg-white text-center font-display text-6xl font-bold tracking-widest placeholder:text-muted-foreground/20 outline-none transition-all duration-300",
          "border-b-4 border-border focus:border-primary focus:border-b-8",
          isError && "border-destructive text-destructive focus:border-destructive animate-shake",
          isSuccess && "border-success text-success focus:border-success",
          className
        )}
        onKeyDown={handleKeyDown}
        autoFocus
        autoComplete="off"
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
