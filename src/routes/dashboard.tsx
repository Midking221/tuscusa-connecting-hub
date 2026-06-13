import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardGate,
});

function DashboardGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;
  return <DashboardShell />;
}
