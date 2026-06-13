import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, WARDS, SKILL_OPTIONS } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  ward: z.string().max(100).optional().or(z.literal("")),
  employment_status: z.enum(["employed", "self_employed", "unemployed", "student", "other"]),
  bio: z.string().max(500).optional().or(z.literal("")),
});

function ProfilePage() {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    ward: profile?.ward ?? "",
    employment_status: (profile?.employment_status ?? "unemployed") as "employed" | "self_employed" | "unemployed" | "student" | "other",
    bio: profile?.bio ?? "",
  });
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);

  const { data: live } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          ward: data.ward ?? "",
          employment_status: data.employment_status ?? "unemployed",
          bio: data.bio ?? "",
        });
        setSkills(data.skills ?? []);
      }
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.errors[0].message);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: parsed.data.full_name,
          phone: parsed.data.phone || null,
          ward: parsed.data.ward || null,
          employment_status: parsed.data.employment_status,
          bio: parsed.data.bio || null,
          skills,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      window.location.reload();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleSkill = (skill: string) => {
    setSkills((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Keep your member registry info up to date.</p>
      </div>

      <Card className="p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-hero text-primary-foreground font-bold flex items-center justify-center">
          {(live?.full_name ?? form.full_name ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{live?.full_name ?? form.full_name}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <Badge variant={live?.verification_status === "verified" ? "default" : "outline"}>
          {live?.verification_status ?? "pending"}
        </Badge>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XX XXX XXX" maxLength={30} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ward">Ward</Label>
            <Select value={form.ward || undefined} onValueChange={(v) => setForm({ ...form, ward: v })}>
              <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
              <SelectContent>
                {WARDS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Employment status</Label>
          <Select value={form.employment_status} onValueChange={(v) => setForm({ ...form, employment_status: v as typeof form.employment_status })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">Employed</SelectItem>
              <SelectItem value="self_employed">Self-employed</SelectItem>
              <SelectItem value="unemployed">Unemployed</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkill(s)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  skills.includes(s)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} placeholder="Tell others about yourself" />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </Card>
    </div>
  );
}
