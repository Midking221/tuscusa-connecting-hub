import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Search, UserCog } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/roles")({
  component: RolesPage,
});

const ROLE_ORDER: AppRole[] = ["admin", "executive", "member"];

function RolesPage() {
  const { isAdmin, loading, user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-roles-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, ward, verification_status")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-roles-all"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data as { user_id: string; role: AppRole }[];
    },
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    return map;
  }, [roles]);

  const grant = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role granted"); qc.invalidateQueries({ queryKey: ["admin-roles-all"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role revoked"); qc.invalidateQueries({ queryKey: ["admin-roles-all"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && !isAdmin) return <Navigate to="/dashboard" />;

  const filtered = (profiles ?? []).filter((p) =>
    !q.trim() || (p.full_name ?? "").toLowerCase().includes(q.toLowerCase()) || (p.ward ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" /> Manage roles
        </h1>
        <p className="text-muted-foreground mt-1">Grant or revoke admin and executive roles. You cannot remove your own admin role.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ward…" className="pl-9" />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((p) => {
          const userRoles = rolesByUser.get(p.id) ?? [];
          const isSelf = p.id === user?.id;
          return (
            <Card key={p.id} className="p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-hero text-primary-foreground font-semibold flex items-center justify-center">
                  {p.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-2">
                    {p.full_name}
                    {isSelf && <Badge variant="outline" className="text-[10px]">You</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.ward ?? "No ward"} · {p.verification_status}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {userRoles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                {ROLE_ORDER.filter((r) => userRoles.includes(r)).map((r) => (
                  <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="capitalize">
                    {r === "admin" && <ShieldCheck className="h-3 w-3 mr-1" />}{r}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {ROLE_ORDER.map((r) => {
                  const has = userRoles.includes(r);
                  const disableRevokeSelfAdmin = isSelf && r === "admin" && has;
                  return has ? (
                    <Button
                      key={r}
                      size="sm"
                      variant="outline"
                      disabled={disableRevokeSelfAdmin || revoke.isPending}
                      onClick={() => revoke.mutate({ user_id: p.id, role: r })}
                      title={disableRevokeSelfAdmin ? "You cannot revoke your own admin role" : undefined}
                    >
                      Revoke {r}
                    </Button>
                  ) : (
                    <Button key={r} size="sm" variant={r === "admin" ? "default" : "secondary"} disabled={grant.isPending} onClick={() => grant.mutate({ user_id: p.id, role: r })}>
                      Grant {r}
                    </Button>
                  );
                })}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && !isLoading && (
          <Card className="p-12 text-center text-muted-foreground col-span-full">No members found.</Card>
        )}
      </div>
    </div>
  );
}