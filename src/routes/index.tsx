import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, Vote, Wallet, Sparkles, Calendar, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TUSCUSA — Turkana South Colleges & Universities Students Association" },
      { name: "description", content: "The official engagement platform for the Turkana South Colleges and Universities Students Association. Register, vote, track funds, and discover opportunities." },
      { property: "og:title", content: "TUSCUSA — Turkana South Colleges & Universities Students Association" },
      { property: "og:description", content: "Member registry, voting, funding transparency, and opportunities for students of Turkana South." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const [members, polls, funding, events] = await Promise.all([
        (supabase as any).from("public_profiles").select("id", { count: "exact", head: true }),
        supabase.from("polls").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("funding").select("amount"),
        supabase.from("events").select("id", { count: "exact", head: true }).gte("starts_at", new Date().toISOString()),
      ]);
      const totalFunds = (funding.data ?? []).reduce((s, r: { amount: number }) => s + Number(r.amount ?? 0), 0);
      return {
        members: members.count ?? 0,
        polls: polls.count ?? 0,
        funds: totalFunds,
        events: events.count ?? 0,
      };
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.78 0.16 85 / 0.3) 0, transparent 50%), radial-gradient(circle at 80% 70%, oklch(0.58 0.16 150 / 0.3) 0, transparent 50%)"
        }} />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-6 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              Turkana South Colleges & Universities Students Association
            </div>
            <h1 className="text-balance text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              The student platform built <span className="text-gold">by us, for us.</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 max-w-2xl mb-8 leading-relaxed">
              TUSCUSA unites college and university students of Turkana South — register in the member registry, vote on association decisions, track every shilling of bursary and government funding, and discover opportunities, all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="bg-gold-gradient text-gold-foreground hover:opacity-95 shadow-elevated">
                  Join the registry <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/transparency">
                <Button size="lg" variant="outline" className="bg-white/10 text-primary-foreground border-white/30 hover:bg-white/20">
                  See funding transparency
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Verified members", value: stats?.members ?? 0, icon: Users },
            { label: "Active votes", value: stats?.polls ?? 0, icon: Vote },
            { label: "Funds tracked (KES)", value: stats ? new Intl.NumberFormat().format(stats.funds) : "0", icon: Wallet },
            { label: "Upcoming events", value: stats?.events ?? 0, icon: Calendar },
          ].map((s) => (
            <Card key={s.label} className="p-4 md:p-5 shadow-card">
              <s.icon className="h-5 w-5 text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything in one platform</h2>
          <p className="text-muted-foreground text-lg">
            Whether you're a member, an executive, a partner, or a curious citizen — TUSCUSA gives every student of Turkana South in college or university the tools to participate and the transparency to trust.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Users, title: "Member registry", desc: "Register with your home ward, institution and skills. Get verified by the executive. Discover other TUSCUSA members." },
            { icon: Vote, title: "Vote on decisions", desc: "Cast votes on constitutional amendments, budgets, executive endorsements and association resolutions." },
            { icon: Wallet, title: "Funding transparency", desc: "Track HELB, CDF bursaries, Uwezo, Youth Enterprise and donor funds down to the shilling." },
            { icon: Calendar, title: "Opportunities", desc: "Internships, scholarships, jobs, mentorship and training — curated for Turkana South students." },
            { icon: Sparkles, title: "Talent directory", desc: "Showcase your craft. Find skilled students and clubs across colleges and universities." },
            { icon: ShieldCheck, title: "Trusted governance", desc: "Read financial statements, AGM minutes, and executive decisions anytime." },
          ].map((f) => (
            <Card key={f.title} className="p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="p-8 md:p-12 bg-hero text-primary-foreground border-0 text-center shadow-elevated">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Ready to be counted?</h2>
          <p className="text-primary-foreground/85 max-w-xl mx-auto mb-6">
            Join fellow college and university students from Turkana South shaping our association's future. Registration takes less than a minute.
          </p>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="bg-gold-gradient text-gold-foreground hover:opacity-95">
              Create your member account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <SiteFooter />
    </div>
  );
}
