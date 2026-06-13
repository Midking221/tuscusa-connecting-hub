import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, WARDS } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Sparkles, MapPin, Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/talents")({
  component: TalentsPage,
});

function TalentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    talent_type: "individual" as "individual" | "group",
    category: "",
    ward: "",
    description: "",
    contact: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dash-talents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("talents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (form.name.trim().length < 2) throw new Error("Name required");
      const { error } = await supabase.from("talents").insert({
        name: form.name.trim(),
        talent_type: form.talent_type,
        category: form.category.trim() || null,
        ward: form.ward || null,
        description: form.description.trim() || null,
        contact: form.contact.trim() || null,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Talent listed");
      setOpen(false);
      setForm({ name: "", talent_type: "individual", category: "", ward: "", description: "", contact: "" });
      qc.invalidateQueries({ queryKey: ["dash-talents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("talents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["dash-talents"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Talent directory</h1>
          <p className="text-muted-foreground mt-1">List yourself or your group so others can discover you.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add listing</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>List your talent</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={150} /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.talent_type} onValueChange={(v) => setForm({ ...form, talent_type: v as "individual" | "group" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group / Club</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ward</Label>
                  <Select value={form.ward || undefined} onValueChange={(v) => setForm({ ...form, ward: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{WARDS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Category / skill</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Music, Welding, Photography" maxLength={100} /></div>
              <div className="space-y-1.5"><Label>Contact</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Phone or email" maxLength={100} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} /></div>
              <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Adding…" : "Add to directory"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && data?.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground"><Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />No talents listed yet.</Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((t: { id: string; name: string; talent_type: string; category: string | null; ward: string | null; description: string | null; contact: string | null; user_id: string | null }) => (
          <Card key={t.id} className="p-5 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline">{t.talent_type}</Badge>
              {t.user_id === user?.id && (
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              )}
            </div>
            <h3 className="font-semibold">{t.name}</h3>
            {t.category && <div className="text-sm text-primary font-medium">{t.category}</div>}
            {t.ward && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{t.ward}</div>}
            {t.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{t.description}</p>}
            {t.contact && <p className="text-xs mt-2 font-medium">📞 {t.contact}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
