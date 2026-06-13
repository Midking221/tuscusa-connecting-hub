import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Opportunities — TUSCUSA" },
      { name: "description", content: "Upcoming jobs, training programs, bursaries, and talent showcases for TUSCUSA members." },
      { property: "og:title", content: "Events & Opportunities — TUSCUSA" },
      { property: "og:description", content: "Discover jobs, training, bursaries and showcases." },
    ],
  }),
  component: EventsPage,
});

const CAT_LABEL: Record<string, string> = {
  job: "Job", training: "Training", bursary: "Bursary", showcase: "Showcase", meeting: "Meeting", other: "Other",
};

function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const upcoming = (data ?? []).filter((e: { starts_at: string }) => new Date(e.starts_at) >= new Date());
  const past = (data ?? []).filter((e: { starts_at: string }) => new Date(e.starts_at) < new Date()).reverse();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-hero text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-4 border border-white/20">
              <Calendar className="h-3 w-3" /> Opportunities calendar
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Events & opportunities</h1>
            <p className="text-primary-foreground/85 max-w-2xl">Jobs, training, bursaries, and showcases — never miss a chance.</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!isLoading && upcoming.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">No upcoming events.</Card>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>

          {past.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-4 mt-12">Past events</h2>
              <div className="grid md:grid-cols-2 gap-4 opacity-70">
                {past.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EventCard({ event }: { event: { id: string; title: string; description: string | null; category: string; location: string | null; starts_at: string; link_url: string | null } }) {
  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-start justify-between mb-2">
        <Badge variant="secondary">{CAT_LABEL[event.category] ?? event.category}</Badge>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{new Date(event.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
          <div className="text-xs text-muted-foreground">{new Date(event.starts_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
      {event.location && (
        <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3" /> {event.location}
        </div>
      )}
      {event.description && <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>}
      {event.link_url && (
        <a href={event.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-medium inline-flex items-center mt-3 hover:underline">
          Learn more <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      )}
    </Card>
  );
}
