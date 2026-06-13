import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Public Reports — TUSCUSA" },
      { name: "description", content: "Financial statements, meeting minutes, and executive decisions published by TUSCUSA." },
      { property: "og:title", content: "Public Reports — TUSCUSA" },
      { property: "og:description", content: "TUSCUSA governance documents." },
    ],
  }),
  component: ReportsPage,
});

const CAT_LABEL: Record<string, string> = {
  financial: "Financial",
  minutes: "Meeting Minutes",
  decision: "Executive Decision",
  other: "Other",
};

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("is_published", true).order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = data ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-hero text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-4 border border-white/20">
              <FileText className="h-3 w-3" /> Public reports
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Reports & governance</h1>
            <p className="text-primary-foreground/85 max-w-2xl">All financial statements, minutes, and executive decisions — open to the public.</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!isLoading && list.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">No reports published yet.</Card>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {list.map((r: { id: string; title: string; summary: string | null; category: string; file_url: string | null; published_at: string | null }) => (
              <Card key={r.id} className="p-5 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary">{CAT_LABEL[r.category] ?? r.category}</Badge>
                  {r.published_at && (
                    <span className="text-xs text-muted-foreground">{new Date(r.published_at).toLocaleDateString()}</span>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-1">{r.title}</h3>
                {r.summary && <p className="text-sm text-muted-foreground line-clamp-3">{r.summary}</p>}
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-medium inline-flex items-center mt-3 hover:underline">
                    <Download className="h-3 w-3 mr-1" /> Open document
                  </a>
                )}
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
