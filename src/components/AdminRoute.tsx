import { Outlet, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export default function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bone)] pt-24 flex items-center justify-center">
        <p className="text-[var(--color-bark-warm)]">Checking permissions...</p>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
