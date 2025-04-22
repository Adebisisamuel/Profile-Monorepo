import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M76 45V155H45V76H76V45Z" 
        fill="#00DBA7" 
      />
      <path 
        d="M155 45H124V76H155V120H124V155H76V120H124V76H76V45H155Z" 
        fill="#00DBA7" 
      />
    </svg>
  );
}
