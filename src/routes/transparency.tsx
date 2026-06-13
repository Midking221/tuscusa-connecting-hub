import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Funding Transparency — TUSCUSA" },
      { name: "description", content: "Public record of every shilling — Uwezo Fund, Youth Enterprise Fund, bursaries, and other government disbursements tracked transparently." },
      { property: "og:title", content: "Funding Transparency — TUSCUSA" },
      { property: "og:description", content: "Public funding record for TUSCUSA youth programs." },
    ],
  }),
  component: TransparencyPage,
});

const SOURCE_LABEL: Record<string, string> = {
  uwezo_fund: "Uwezo Fund",
  youth_enterprise_fund: "Youth Enterprise Fund",
  bursary: "Bursary",
  ngaaf: "NGAAF",
  other: "Other",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  received: "secondary",
  allocated: "outline",
  disbursed: "default",
};

function TransparencyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-funding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding")
        .select("*")
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const records = data ?? [];
  const total = records.reduce((s, r: { amount: number }) => s + Number(r.amount ?? 0), 0);
  const disbursed = records.filter((r: { status: string }) => r.status === "disbursed").reduce((s, r: { amount: number }) => s + Number(r.amount), 0);

  const bySource = records.reduce((acc: Record<string, number>, r: { source: string; amount: number }) => {
    acc[r.source] = (acc[r.source] ?? 0) + Number(r.amount);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-hero text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-4 border border-white/20">
              <Wallet className="h-3 w-3" /> Public funding record
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Funding transparency</h1>
            <p className="text-primary-foreground/85 max-w-2xl">
              Every shilling received, allocated, and disbursed by TUSCUSA — published openly for public scrutiny.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 -mt-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-5 shadow-card">
              <ArrowDownCircle className="h-5 w-5 text-success mb-2" />
              <div className="text-2xl font-bold">KES {new Intl.NumberFormat().format(total)}</div>
              <div className="text-sm text-muted-foreground">Total tracked</div>
            </Card>
            <Card className="p-5 shadow-card">
              <ArrowUpCircle className="h-5 w-5 text-primary mb-2" />
              <div className="text-2xl font-bold">KES {new Intl.NumberFormat().format(disbursed)}</div>
              <div className="text-sm text-muted-foreground">Disbursed to beneficiaries</div>
            </Card>
            <Card className="p-5 shadow-card">
              <TrendingUp className="h-5 w-5 text-gold mb-2" />
              <div className="text-2xl font-bold">{records.length}</div>
              <div className="text-sm text-muted-foreground">Recorded transactions</div>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold mb-4">By source</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {Object.entries(bySource).map(([src, amt]) => (
              <Card key={src} className="p-4 shadow-card">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{SOURCE_LABEL[src] ?? src}</div>
                <div className="text-lg font-bold mt-1">KES {new Intl.NumberFormat().format(amt)}</div>
              </Card>
            ))}
            {Object.keys(bySource).length === 0 && (
              <Card className="p-4 col-span-full text-sm text-muted-foreground">No funding records yet.</Card>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-4">All transactions</h2>
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
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                  )}
                  {!isLoading && records.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions yet.</td></tr>
                  )}
                  {records.map((r: { id: string; recorded_at: string; source: string; title: string; beneficiary: string | null; amount: number; status: string; currency: string }) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{new Date(r.recorded_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{SOURCE_LABEL[r.source] ?? r.source}</td>
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.beneficiary ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{r.currency} {new Intl.NumberFormat().format(r.amount)}</td>
                      <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
