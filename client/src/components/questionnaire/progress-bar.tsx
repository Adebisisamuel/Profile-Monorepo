import React from "react";

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-teal transition-all duration-300 ease-in-out" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
