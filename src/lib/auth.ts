import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "executive" | "member";

export interface AuthProfile {
  id: string;
  full_name: string | null;
  ward: string | null;
  employment_status: string | null;
  skills: string[] | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  verification_status: "pending" | "verified" | "rejected";
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  roles: AppRole[];
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUserData = async (uid: string) => {
      const [{ data: prof }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      if (!mounted) return;
      setProfile((prof as AuthProfile | null) ?? null);
      setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => loadUserData(sess.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadUserData(sess.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isStaff = roles.includes("admin") || roles.includes("executive");

  return {
    user: session?.user ?? null,
    session,
    profile,
    roles,
    loading,
    isStaff,
    isAdmin: roles.includes("admin"),
    isVerified: profile?.verification_status === "verified",
  };
}

// Wards of Turkana South Constituency
export const WARDS = [
  "Kaputir",
  "Katilu",
  "Lobokat",
  "Lokichar",
  "Kalapata",
  "Diaspora (Outside Turkana South)",
  "Other",
];

export const SKILL_OPTIONS = [
  "Agriculture",
  "ICT / Software",
  "Carpentry",
  "Tailoring",
  "Hairdressing",
  "Plumbing",
  "Electrical",
  "Teaching",
  "Healthcare",
  "Art & Design",
  "Music",
  "Sports",
  "Welding",
  "Driving",
  "Business",
  "Photography",
  "Videography",
];
