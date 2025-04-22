import React, { useState, useEffect } from 'react';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface QuestionnaireSliderProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function QuestionnaireSlider({ value, onChange }: QuestionnaireSliderProps) {
  // Always start with a default value (3) if no value is specified
  const [internalValue, setInternalValue] = useState<number>(value ?? 3);
  
  // Update when value changes
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Handler for slider value change
  const handleValueChange = (newValue: number[]) => {
    const intValue = newValue[0];
    setInternalValue(intValue);
    onChange(intValue);
    console.log(`Slider value changed to: ${intValue}`);
  };

  // Handler for clicking number buttons
  const handleCircleClick = (circleValue: number) => {
    console.log(`Number ${circleValue} clicked directly`);
    setInternalValue(circleValue);
    onChange(circleValue);
  };

  // Determine which set of labels to use
  const isLeftSide = internalValue < 3;
  
  // Get labels based on position
  const getLabels = () => {
    // For left side (Statement 1), values increase from right to left (5->0)
    // For right side (Statement 2), values increase from left to right (0->5)
    const leftSideLabels = [5, 4, 3, 2, 1, 0];
    const rightSideLabels = [0, 1, 2, 3, 4, 5];
    
    return isLeftSide ? leftSideLabels : rightSideLabels;
  };
  
  return (
    <div className="mt-10 relative">
      <div className="w-full px-3">
        <div className="relative flex w-full touch-none select-none items-center">
          <SliderPrimitive.Root
            value={[internalValue]}
            min={0}
            max={5}
            step={1}
            onValueChange={handleValueChange}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track 
              className="relative h-3 w-full grow overflow-hidden rounded-full bg-gray-200"
            >
              <SliderPrimitive.Range className="absolute h-full bg-transparent" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-9 w-9 rounded-full border-2 border-teal bg-white shadow-md" />
          </SliderPrimitive.Root>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        {getLabels().map((value, index) => {
          // Special styling for the 0 value to make it more prominent
          const isZero = value === 0;
          const isSelected = internalValue === index;
          
          return (
            <div 
              key={index}
              className="flex flex-col items-center cursor-pointer"
              style={{width: '16.6%'}}
              onClick={() => handleCircleClick(index)}
            >
              <div 
                className={cn(
                  "text-sm flex justify-center px-3 py-1 rounded-full transition-all", 
                  isSelected
                    ? "font-bold text-white bg-teal-600 scale-110" 
                    : isZero 
                      ? "text-red-600 border-2 border-red-400 bg-red-50 hover:bg-red-100" 
                      : "text-gray-700 border border-gray-300 hover:bg-gray-100"
                )}
              >
                {value}
              </div>
              {isZero && (
                <span className="text-xs text-red-600 mt-1 font-bold bg-red-50 px-2 py-1 rounded-full border border-red-200">
                  Klik hier voor 0
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
