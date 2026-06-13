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
import { Plus, Wallet, Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/funding")({
  component: FundingPage,
});

const SOURCE_LABEL: Record<string, string> = {
  uwezo_fund: "Uwezo Fund", youth_enterprise_fund: "Youth Enterprise Fund",
  bursary: "Bursary", ngaaf: "NGAAF", other: "Other",
};

function FundingPage() {
  const { user, isStaff, loading } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    source: "uwezo_fund" as keyof typeof SOURCE_LABEL,
    title: "",
    description: "",
    amount: "",
    beneficiary: "",
    status: "received" as "received" | "allocated" | "disbursed",
    recorded_at: new Date().toISOString().slice(0, 10),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-funding"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("funding").select("*").order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const amt = Number(form.amount);
      if (form.title.trim().length < 3) throw new Error("Title too short");
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Amount must be positive");
      const { error } = await supabase.from("funding").insert({
        source: form.source as "uwezo_fund" | "youth_enterprise_fund" | "bursary" | "ngaaf" | "other",
        title: form.title.trim(),
        description: form.description.trim() || null,
        amount: amt,
        beneficiary: form.beneficiary.trim() || null,
        status: form.status,
        recorded_at: form.recorded_at,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recorded");
      setOpen(false);
      setForm({ source: "uwezo_fund", title: "", description: "", amount: "", beneficiary: "", status: "received", recorded_at: new Date().toISOString().slice(0, 10) });
      qc.invalidateQueries({ queryKey: ["admin-funding"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("funding").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-funding"] }); },
  });

  if (!loading && !isStaff) return <Navigate to="/dashboard" />;

  const records = data ?? [];
  const total = records.reduce((s, r: { amount: number }) => s + Number(r.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Funding management
          </h1>
          <p className="text-muted-foreground mt-1">Track Uwezo Fund, Youth Enterprise Fund, and bursary flows.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Log entry</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log funding entry</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as typeof form.source })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(SOURCE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="allocated">Allocated</SelectItem>
                      <SelectItem value="disbursed">Disbursed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount (KES)</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.recorded_at} onChange={(e) => setForm({ ...form, recorded_at: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Beneficiary (optional)</Label><Input value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} maxLength={200} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} /></div>
              <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Saving…" : "Save entry"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-5 shadow-card">
        <div className="text-sm text-muted-foreground">Total tracked</div>
        <div className="text-3xl font-bold">KES {new Intl.NumberFormat().format(total)}</div>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Beneficiary</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && !isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No entries yet.</td></tr>
              )}
              {records.map((r: { id: string; recorded_at: string; source: string; title: string; beneficiary: string | null; amount: number; status: string; currency: string }) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.recorded_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{SOURCE_LABEL[r.source]}</td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.beneficiary ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{r.currency} {new Intl.NumberFormat().format(r.amount)}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{r.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
