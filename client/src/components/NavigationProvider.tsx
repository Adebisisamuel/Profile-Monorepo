import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setNavigateFunction } from "@/utils/navigation";

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  
  // Register the navigate function when the component mounts
  useEffect(() => {
    setNavigateFunction(navigate);
  }, [navigate]);
  
  // Simply render children
  return <>{children}</>;
}