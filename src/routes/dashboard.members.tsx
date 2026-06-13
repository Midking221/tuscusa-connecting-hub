import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WARDS, SKILL_OPTIONS } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/dashboard/members")({
  component: MembersPage,
});

function MembersPage() {
  const [q, setQ] = useState("");
  const [ward, setWard] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["members-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("public_profiles")
        .select("id, full_name, ward, employment_status, skills, bio, verification_status")
        .order("full_name");
      if (error) throw error;
      return data as Array<{ id: string; full_name: string; ward: string | null; employment_status: string | null; skills: string[] | null; bio: string | null; verification_status: string }>;
    },
  });

  const list = (data ?? []).filter((m: { full_name: string; ward: string | null; skills: string[] | null; bio: string | null }) => {
    if (ward !== "all" && m.ward !== ward) return false;
    if (skill !== "all" && !(m.skills ?? []).includes(skill)) return false;
    if (q) {
      const s = q.toLowerCase();
      const match = [m.full_name, m.ward, m.bio, ...(m.skills ?? [])].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground mt-1">Browse verified TUSCUSA youth.</p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <Input placeholder="Search members…" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
        <Select value={ward} onValueChange={setWard}>
          <SelectTrigger className="md:max-w-[180px]"><SelectValue placeholder="Ward" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All wards</SelectItem>
            {WARDS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={skill} onValueChange={setSkill}>
          <SelectTrigger className="md:max-w-[180px]"><SelectValue placeholder="Skill" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            {SKILL_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && list.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">No members match your filters.</Card>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((m: { id: string; full_name: string; ward: string | null; employment_status: string | null; skills: string[] | null; bio: string | null }) => (
          <Card key={m.id} className="p-5 shadow-card">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-hero text-primary-foreground font-semibold flex items-center justify-center shrink-0">
                {m.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{m.full_name}</div>
                {m.ward && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {m.ward}
                  </div>
                )}
              </div>
            </div>
            {m.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{m.bio}</p>}
            {m.skills && m.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {m.skills.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                {m.skills.length > 4 && <Badge variant="outline" className="text-[10px]">+{m.skills.length - 4}</Badge>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
