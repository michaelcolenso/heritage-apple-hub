import { LOGIN_PATH } from "@/const";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Outlet } from "react-router";

type ProtectedRouteProps = {
  loadingMessage?: string;
  unauthorizedMessage?: string;
};

export default function ProtectedRoute({
  loadingMessage = "Checking your session...",
  unauthorizedMessage = "Please sign in to continue.",
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bone)] pt-24 flex items-center justify-center">
        <p className="text-[var(--color-bark-warm)]">{loadingMessage}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-bone)] pt-24 flex items-center justify-center px-4">
        <div className="bg-[var(--color-surface-solid)] rounded-2xl p-6 max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl text-[var(--color-bark)]">Authentication Required</h1>
          <p className="text-sm text-[var(--color-bark-warm)]">{unauthorizedMessage}</p>
          <Button
            className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
            onClick={() => {
              window.location.href = LOGIN_PATH;
            }}
          >
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
