import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/verify")({
  component: VerifyPage,
});

function VerifyPage() {
  const { isStaff, loading, user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verify"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" | "pending" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: status,
          verified_at: status === "verified" ? new Date().toISOString() : null,
          verified_by: status === "verified" ? user!.id : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Member updated"); qc.invalidateQueries({ queryKey: ["admin-verify"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && !isStaff) return <Navigate to="/dashboard" />;

  const pending = (data ?? []).filter((p: { verification_status: string }) => p.verification_status === "pending");
  const others = (data ?? []).filter((p: { verification_status: string }) => p.verification_status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Member verification
        </h1>
        <p className="text-muted-foreground mt-1">Approve registrations to maintain a trusted member list.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Pending ({pending.length})</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && pending.length === 0 && <Card className="p-6 text-sm text-muted-foreground">No pending registrations.</Card>}
        <div className="grid md:grid-cols-2 gap-3">
          {pending.map((p: { id: string; full_name: string; ward: string | null; skills: string[] | null; bio: string | null; employment_status: string | null }) => (
            <Card key={p.id} className="p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-hero text-primary-foreground font-semibold flex items-center justify-center">
                  {p.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {p.ward ? (<><MapPin className="h-3 w-3" /> {p.ward}</>) : "No ward set"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Status: {p.employment_status}</div>
              {p.skills && p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.skills.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                </div>
              )}
              {p.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{p.bio}</p>}
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => update.mutate({ id: p.id, status: "verified" })}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => update.mutate({ id: p.id, status: "rejected" })}>Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">All members</h2>
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Ward</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Action</th></tr>
              </thead>
              <tbody>
                {others.map((p: { id: string; full_name: string; ward: string | null; verification_status: string }) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{p.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.ward ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={p.verification_status === "verified" ? "default" : "destructive"}>{p.verification_status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {p.verification_status === "verified" ? (
                        <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: p.id, status: "pending" })}>Revert</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: p.id, status: "verified" })}>Approve</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
