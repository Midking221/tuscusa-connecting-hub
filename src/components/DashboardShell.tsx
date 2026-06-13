import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Vote,
  Calendar,
  Sparkles,
  Wallet,
  FileText,
  ShieldCheck,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";

const memberNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/members", label: "Members", icon: Users },
  { to: "/dashboard/suggestions", label: "Suggestions", icon: MessageSquare },
  { to: "/dashboard/votes", label: "Votes", icon: Vote },
  { to: "/dashboard/events", label: "Events", icon: Calendar },
  { to: "/dashboard/talents", label: "Talents", icon: Sparkles },
  { to: "/dashboard/profile", label: "My Profile", icon: ShieldCheck },
];

const adminNav = [
  { to: "/dashboard/admin/verify", label: "Verify Members", icon: ShieldCheck },
  { to: "/dashboard/admin/funding", label: "Funding", icon: Wallet },
  { to: "/dashboard/admin/reports", label: "Reports", icon: FileText },
];

export function DashboardShell() {
  const { profile, isStaff, isVerified } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      <div className="px-3 pb-2 pt-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">Member</div>
      {memberNav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
      {isStaff && (
        <>
          <div className="px-3 pb-2 pt-4 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">Executive</div>
          {adminNav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 h-16 px-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient text-gold-foreground font-bold text-sm">T</div>
          <div className="leading-tight">
            <div className="font-bold text-sm">TUSCUSA</div>
            <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Dashboard</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs">
            <div className="font-medium text-sidebar-foreground truncate">{profile?.full_name ?? "Member"}</div>
            <div className="text-sidebar-foreground/60 truncate">
              {isStaff ? "Executive" : isVerified ? "Verified member" : "Pending verification"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground p-3 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <Link to="/" className="flex items-center gap-2 mb-4 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient text-gold-foreground font-bold text-sm">T</div>
              <span className="font-bold">TUSCUSA</span>
            </Link>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              <NavLinks />
            </nav>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent"
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 border-b border-border bg-background flex items-center px-3 gap-3">
          <button onClick={() => setOpen(true)} className="p-2"><Menu className="h-5 w-5" /></button>
          <span className="font-semibold">TUSCUSA</span>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
