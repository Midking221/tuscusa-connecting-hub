import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, User as UserIcon, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/talents")({
  head: () => ({
    meta: [
      { title: "Talent Directory — TUSCUSA" },
      { name: "description", content: "Discover skilled individuals and youth groups across the ward — listed in the TUSCUSA talent directory." },
      { property: "og:title", content: "Talent Directory — TUSCUSA" },
      { property: "og:description", content: "Browse the TUSCUSA talent directory." },
    ],
  }),
  component: TalentsPage,
});

function TalentsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["public-talents"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("public_talents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; name: string; talent_type: string; category: string | null; ward: string | null; description: string | null; image_url: string | null }>;
    },
  });
  const list = (data ?? []).filter((t) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [t.name, t.category, t.ward, t.description].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s));
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-hero text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-4 border border-white/20">
              <Sparkles className="h-3 w-3" /> Talent directory
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Discover local talent</h1>
            <p className="text-primary-foreground/85 max-w-2xl">
              Skilled youth and groups across our wards. Search, connect, and hire from your community.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <Input
            placeholder="Search by name, skill, ward…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
        </section>

        <section className="container mx-auto px-4 pb-16">
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!isLoading && list.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">No talents listed yet.</Card>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((t) => (
              <Card key={t.id} className="p-5 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    {t.talent_type === "group" ? <UsersIcon className="h-5 w-5 text-primary" /> : <UserIcon className="h-5 w-5 text-primary" />}
                  </div>
                  <Badge variant="outline">{t.talent_type}</Badge>
                </div>
                <h3 className="font-semibold text-lg">{t.name}</h3>
                {t.category && <div className="text-sm text-primary font-medium">{t.category}</div>}
                {t.ward && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {t.ward}
                  </div>
                )}
                {t.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{t.description}</p>}
                <p className="text-xs text-muted-foreground mt-3 italic">Sign in to view contact details.</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
