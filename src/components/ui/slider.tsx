'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange(parseFloat(e.target.value));
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        type="range"
        className={cn(
          'w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer',
          'accent-blue-600 dark:accent-blue-500',
          '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:shadow-md',
          '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600',
          '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
