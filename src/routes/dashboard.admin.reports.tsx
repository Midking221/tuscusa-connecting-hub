import { createFileRoute, Navigate } from "@tanstack/react-router";
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
import { Plus, FileText, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/reports")({
  component: ReportsAdminPage,
});

const CAT_LABEL: Record<string, string> = { financial: "Financial", minutes: "Minutes", decision: "Decision", other: "Other" };

function ReportsAdminPage() {
  const { user, isStaff, loading } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "financial" as keyof typeof CAT_LABEL,
    summary: "",
    file_url: "",
    is_published: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (form.title.trim().length < 3) throw new Error("Title too short");
      const { error } = await supabase.from("reports").insert({
        title: form.title.trim(),
        category: form.category as "financial" | "minutes" | "decision" | "other",
        summary: form.summary.trim() || null,
        file_url: form.file_url.trim() || null,
        is_published: form.is_published,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report saved");
      setOpen(false);
      setForm({ title: "", category: "financial", summary: "", file_url: "", is_published: true });
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-reports"] }); },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("reports").update({ is_published, published_at: is_published ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  if (!loading && !isStaff) return <Navigate to="/dashboard" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Reports
          </h1>
          <p className="text-muted-foreground mt-1">Publish financial statements, minutes, and executive decisions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New report</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Publish new report</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Summary</Label><Textarea rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} maxLength={1500} /></div>
              <div className="space-y-1.5"><Label>Document link (URL)</Label><Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://" maxLength={500} /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                Publish publicly immediately
              </label>
              <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Saving…" : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="grid md:grid-cols-2 gap-3">
        {(data ?? []).map((r: { id: string; title: string; summary: string | null; category: string; file_url: string | null; is_published: boolean; published_at: string | null }) => (
          <Card key={r.id} className="p-5 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="secondary">{CAT_LABEL[r.category]}</Badge>
              <Badge variant={r.is_published ? "default" : "outline"}>{r.is_published ? "Public" : "Draft"}</Badge>
            </div>
            <h3 className="font-semibold">{r.title}</h3>
            {r.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{r.summary}</p>}
            <div className="flex items-center gap-2 mt-3">
              {r.file_url && (
                <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center hover:underline">
                  Open <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
              <div className="flex-1" />
              <Button size="sm" variant="ghost" onClick={() => togglePublish.mutate({ id: r.id, is_published: !r.is_published })}>
                {r.is_published ? "Unpublish" : "Publish"}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </Card>
        ))}
        {(data ?? []).length === 0 && !isLoading && (
          <Card className="p-12 text-center text-muted-foreground col-span-full">No reports yet.</Card>
        )}
      </div>
    </div>
  );
}
