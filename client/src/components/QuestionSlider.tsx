import { useState, useEffect } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface QuestionSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function QuestionSlider({ value, onChange }: QuestionSliderProps) {
  const [sliderValue, setSliderValue] = useState(value);

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  const handleChange = (newValue: number[]) => {
    const val = newValue[0];
    setSliderValue(val);
    onChange(val);
  };

  // Calculate gradient properties based on slider position
  const isLeftSide = sliderValue < 3;
  const isMiddle = sliderValue === 3;
  
  // Generate gradient only on the selected side from position 0 to selected position
  const getTrackStyle = () => {
    // The middle position (3) is neutral - no gradient
    if (isMiddle) {
      return { background: "#f3f4f6" }; // Light gray for neutral position
    }
    
    // Define a stronger green color for better visibility
    const greenColor = "rgba(74, 222, 128, 0.7)"; // Even deeper green with 70% opacity
    const grayColor = "#f3f4f6"; // Light gray
    
    // Map slider positions to percentages on track:
    // Position 0 = 0%, Position 1 = 16.7%, Position 2 = 33.3%
    // Position 3 = 50% (middle), 
    // Position 4 = 66.7%, Position 5 = 83.3%, Position 6 = 100%
    
    // Calculate percentages for middle and selected position
    const middlePercent = 50; // Middle (position 3) is always at 50%
    
    let gradientCSS = "";
    
    if (isLeftSide) {
      // For left side (positions 0, 1, 2):
      // We want gradient ONLY between selected position and middle
      
      // Calculate percentage position based on slider value
      const selectedPercent = (sliderValue / 3) * 50; // Maps position 0->0%, 1->16.7%, 2->33.3%
      
      // Build CSS with gradient ONLY between selected position and middle
      gradientCSS = `
        linear-gradient(to right,
          ${grayColor} 0%,                     /* Gray from far left */
          ${grayColor} ${selectedPercent}%,    /* Gray up to selected position */
          ${greenColor} ${selectedPercent}%,   /* Start green at selected position */
          ${greenColor} ${middlePercent}%,     /* End green at middle position */
          ${grayColor} ${middlePercent}%,      /* Gray again from middle */
          ${grayColor} 100%                    /* Gray to far right */
        )
      `;
    } else {
      // For right side (positions 4, 5, 6):
      // We want gradient ONLY between middle and selected position
      
      // Calculate percentage position based on slider value (4, 5, or 6)
      const selectedPercent = 50 + (((sliderValue - 3) / 3) * 50); // Maps 4->66.7%, 5->83.3%, 6->100%
      
      // Build CSS with gradient ONLY between middle and selected position
      gradientCSS = `
        linear-gradient(to right,
          ${grayColor} 0%,                     /* Gray from far left */
          ${grayColor} ${middlePercent}%,      /* Gray up to middle position */
          ${greenColor} ${middlePercent}%,     /* Start green at middle */
          ${greenColor} ${selectedPercent}%,   /* Green until selected position */
          ${grayColor} ${selectedPercent}%,    /* Gray after selected position */
          ${grayColor} 100%                    /* Gray to far right */
        )
      `;
    }
    
    return { background: gradientCSS };
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-500">Helemaal mee eens met stelling 1</span>
        <span className="text-sm text-gray-500">Helemaal mee eens met stelling 2</span>
      </div>
      
      <div className="relative flex w-full touch-none select-none items-center">
        <SliderPrimitive.Root
          value={[sliderValue]}
          min={0}
          max={6}
          step={1}
          onValueChange={handleChange}
          className="relative flex w-full touch-none select-none items-center"
        >
          <SliderPrimitive.Track 
            className="relative h-2 w-full grow overflow-hidden rounded-full"
            style={getTrackStyle()}
          >
            <SliderPrimitive.Range className="absolute h-full bg-transparent" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-7 w-7 rounded-full border-2 border-primary bg-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
      </div>
      
      <div className="flex justify-between mt-2">
        {/* Show exactly 7 values: 5,3,1,0,1,3,5 */}
        {[
          {label: 5, position: 0},
          {label: 3, position: 1},
          {label: 1, position: 2},
          {label: 0, position: 3},
          {label: 1, position: 4},
          {label: 3, position: 5},
          {label: 5, position: 6}
        ].map((item, idx) => {
          const isSelected = sliderValue === item.position;
          
          return (
            <span 
              key={idx}
              className={`text-sm ${isSelected ? 'font-bold text-primary' : 'text-gray-500'}`}
              style={{cursor: 'pointer'}}
              onClick={() => handleChange([item.position])}
            >
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
