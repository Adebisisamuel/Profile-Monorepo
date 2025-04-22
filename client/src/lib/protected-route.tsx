import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import AppLayout from "@/components/AppLayout";

export function ProtectedRoute({ children, useAppLayout = true }: { children: ReactNode, useAppLayout?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  // If user exists, render the children with or without AppLayout based on prop
  return useAppLayout ? <AppLayout>{children}</AppLayout> : <>{children}</>;
}
