import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/transparency", label: "Transparency" },
  { to: "/talents", label: "Talents" },
  { to: "/events", label: "Events" },
  { to: "/reports", label: "Reports" },
];

export function SiteHeader() {
  const { user, profile, loading } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/tuscusa-logo.png" alt="TUSCUSA" className="h-9 w-9 rounded-full object-cover" />
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight">TUSCUSA</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Turkana South Students</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-foreground rounded-md bg-accent" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {!loading && user ? (
            <>
              <Link to="/dashboard">
                <Button variant="default" size="sm">Dashboard</Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/auth" search={{ mode: "signup" }}><Button size="sm">Join</Button></Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-border my-2" />
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button className="w-full" size="sm">Dashboard</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                >
                  Sign out {profile?.full_name ? `(${profile.full_name})` : ""}
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full" size="sm">Sign in</Button></Link>
                <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}><Button className="w-full" size="sm">Join the registry</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src="/tuscusa-logo.png" alt="TUSCUSA" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-bold">TUSCUSA</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Turkana South Colleges and Universities Students Association — a transparent engagement platform for registry, voting, funding and opportunities.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/transparency" className="hover:text-foreground">Funding Transparency</Link></li>
            <li><Link to="/talents" className="hover:text-foreground">Talent Directory</Link></li>
            <li><Link to="/events" className="hover:text-foreground">Opportunities</Link></li>
            <li><Link to="/reports" className="hover:text-foreground">Reports</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Get involved</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">Register as a member</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} TUSCUSA. All rights reserved.</span>
          <span>Built for transparency & youth empowerment</span>
        </div>
      </div>
    </footer>
  );
}