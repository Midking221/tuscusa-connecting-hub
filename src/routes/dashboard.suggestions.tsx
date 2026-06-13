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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/suggestions")({
  component: SuggestionsPage,
});

const schema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(2000),
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "outline", reviewing: "secondary", responded: "default", closed: "destructive",
};

function SuggestionsPage() {
  const { user, isStaff } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", anonymous: false });
  const [responding, setResponding] = useState<string | null>(null);
  const [response, setResponse] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suggestions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ title: form.title, body: form.body });
      if (!parsed.success) throw new Error(parsed.error.errors[0].message);
      const { error } = await supabase.from("suggestions").insert({
        title: parsed.data.title,
        body: parsed.data.body,
        is_anonymous: form.anonymous,
        user_id: form.anonymous ? null : user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Suggestion submitted");
      setOpen(false);
      setForm({ title: "", body: "", anonymous: false });
      qc.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const respond = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suggestions")
        .update({ response, status: "responded", responded_by: user!.id, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Response posted");
      setResponding(null);
      setResponse("");
      qc.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Suggestions</h1>
          <p className="text-muted-foreground mt-1">Submit feedback and ideas to the executive.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New suggestion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit a suggestion</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} placeholder="A short summary" />
              </div>
              <div className="space-y-1.5">
                <Label>Details</Label>
                <Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={2000} placeholder="Describe your idea or feedback" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.anonymous} onCheckedChange={(c) => setForm({ ...form, anonymous: !!c })} />
                Submit anonymously
              </label>
              <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="w-full">
                {submit.isPending ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && data?.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />No suggestions yet — be the first to share an idea.</Card>
      )}

      <div className="space-y-3">
        {(data ?? []).map((s: { id: string; title: string; body: string; is_anonymous: boolean; created_at: string; status: string; response: string | null }) => (
          <Card key={s.id} className="p-5 shadow-card">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <div className="text-xs text-muted-foreground">
                  {s.is_anonymous ? "Anonymous" : "Member"} · {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>{s.status}</Badge>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{s.body}</p>
            {s.response && (
              <div className="mt-4 p-3 rounded-md bg-accent border-l-2 border-primary">
                <div className="text-xs font-semibold text-primary mb-1">Executive response</div>
                <p className="text-sm whitespace-pre-wrap">{s.response}</p>
              </div>
            )}
            {isStaff && !s.response && (
              <div className="mt-4">
                {responding === s.id ? (
                  <div className="space-y-2">
                    <Textarea rows={3} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Write your response…" maxLength={2000} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respond.mutate(s.id)} disabled={respond.isPending || response.trim().length < 3}>Send response</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setResponding(null); setResponse(""); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setResponding(s.id)}>Respond</Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
