import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Calendar, MapPin, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard/events")({
  component: EventsPage,
});

const CAT_LABEL: Record<string, string> = { job: "Job", training: "Training", bursary: "Bursary", showcase: "Showcase", meeting: "Meeting", other: "Other" };

function EventsPage() {
  const { user, isStaff } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other" as "job" | "training" | "bursary" | "showcase" | "meeting" | "other",
    location: "",
    starts_at: "",
    link_url: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dash-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (form.title.trim().length < 3) throw new Error("Title too short");
      if (!form.starts_at) throw new Error("Start date required");
      const { error } = await supabase.from("events").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        location: form.location.trim() || null,
        starts_at: new Date(form.starts_at).toISOString(),
        link_url: form.link_url.trim() || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event posted");
      setOpen(false);
      setForm({ title: "", description: "", category: "other", location: "", starts_at: "", link_url: "" });
      qc.invalidateQueries({ queryKey: ["dash-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Opportunities, training, and showcases.</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Post a new event</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job">Job</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="bursary">Bursary</SelectItem>
                        <SelectItem value="showcase">Showcase</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Starts at</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={200} /></div>
                <div className="space-y-1.5"><Label>Link (optional)</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://" maxLength={500} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} /></div>
                <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Posting…" : "Post event"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && data?.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground"><Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />No events yet.</Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(data ?? []).map((e: { id: string; title: string; description: string | null; category: string; location: string | null; starts_at: string; link_url: string | null }) => {
          const past = new Date(e.starts_at) < new Date();
          return (
            <Card key={e.id} className={`p-5 shadow-card ${past ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{CAT_LABEL[e.category]}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              <h3 className="font-semibold">{e.title}</h3>
              {e.location && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{e.location}</div>}
              {e.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{e.description}</p>}
              {e.link_url && (
                <a href={e.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center mt-2 hover:underline">
                  Learn more <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
