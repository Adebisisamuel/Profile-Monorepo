import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";

export function ProtectedRoute({
  useAppLayout = true
}: {
  useAppLayout?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return useAppLayout ? <AppLayout><Outlet /></AppLayout> : <Outlet />;
}
