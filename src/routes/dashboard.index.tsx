import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Vote, Wallet, Calendar, MessageSquare, AlertCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { profile, isVerified, isStaff } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dash-stats"],
    queryFn: async () => {
      const [members, polls, funding, events] = await Promise.all([
        (supabase as any).from("public_profiles").select("id", { count: "exact", head: true }),
        supabase.from("polls").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("funding").select("amount"),
        supabase.from("events").select("id", { count: "exact", head: true }).gte("starts_at", new Date().toISOString()),
      ]);
      const totalFunds = (funding.data ?? []).reduce((s, r: { amount: number }) => s + Number(r.amount ?? 0), 0);
      return { members: members.count ?? 0, polls: polls.count ?? 0, funds: totalFunds, events: events.count ?? 0 };
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["dash-activity"],
    queryFn: async () => {
      const [s, e, r] = await Promise.all([
        supabase.from("suggestions").select("id,title,created_at,status").order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("id,title,starts_at,category").order("created_at", { ascending: false }).limit(5),
        supabase.from("reports").select("id,title,published_at,category").order("published_at", { ascending: false }).limit(5),
      ]);
      return { suggestions: s.data ?? [], events: e.data ?? [], reports: r.data ?? [] };
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isStaff ? "Executive dashboard — manage the platform." : "Your member dashboard at a glance."}
        </p>
      </div>

      {!isVerified && !isStaff && (
        <Card className="p-4 border-warning/40 bg-warning/10 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning-foreground shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Your account is pending verification</div>
            <div className="text-sm text-muted-foreground">
              Complete <Link to="/dashboard/profile" className="text-primary underline">your profile</Link> with your ward and skills. An executive will verify your registration shortly.
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Verified members" value={stats?.members ?? 0} />
        <StatCard icon={Vote} label="Active votes" value={stats?.polls ?? 0} />
        <StatCard icon={Wallet} label="Funds tracked" value={`KES ${new Intl.NumberFormat().format(stats?.funds ?? 0)}`} />
        <StatCard icon={Calendar} label="Upcoming events" value={stats?.events ?? 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Recent suggestions</h2>
            <Link to="/dashboard/suggestions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-3">
            {(activity?.suggestions ?? []).map((s: { id: string; title: string; created_at: string; status: string }) => (
              <li key={s.id} className="text-sm border-l-2 border-primary/40 pl-3">
                <div className="font-medium line-clamp-1">{s.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
            {(!activity?.suggestions?.length) && <li className="text-sm text-muted-foreground">No suggestions yet.</li>}
          </ul>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Latest events</h2>
            <Link to="/dashboard/events" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-3">
            {(activity?.events ?? []).map((e: { id: string; title: string; starts_at: string; category: string }) => (
              <li key={e.id} className="text-sm border-l-2 border-gold/60 pl-3">
                <div className="font-medium line-clamp-1">{e.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.starts_at).toLocaleDateString()} · {e.category}
                </div>
              </li>
            ))}
            {(!activity?.events?.length) && <li className="text-sm text-muted-foreground">No events posted.</li>}
          </ul>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />New reports</h2>
            <Link to="/dashboard/admin/reports" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-3">
            {(activity?.reports ?? []).map((r: { id: string; title: string; published_at: string | null; category: string }) => (
              <li key={r.id} className="text-sm border-l-2 border-success/60 pl-3">
                <div className="font-medium line-clamp-1">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.published_at ? new Date(r.published_at).toLocaleDateString() : "—"} · {r.category}
                </div>
              </li>
            ))}
            {(!activity?.reports?.length) && <li className="text-sm text-muted-foreground">No reports yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4 shadow-card">
      <Icon className="h-4 w-4 text-primary mb-2" />
      <div className="text-xl md:text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}
