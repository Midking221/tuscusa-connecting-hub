import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const searchSchema = z.object({
  mode: fallback(z.enum(["signin", "signup"]), "signin").default("signin"),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TUSCUSA" },
      { name: "description", content: "Sign in or create your TUSCUSA member account." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: AuthPage,
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[0-9]/, "Must include a number");

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: passwordSchema,
});

const signinSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required"),
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isSignup = mode === "signup";

  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      if (isSignup) {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          const errs: Record<string, string> = {};
          parsed.error.errors.forEach((er) => { errs[er.path[0] as string] = er.message; });
          setErrors(errs);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.full_name },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("registered")) {
            toast.error("This email is already registered. Try signing in.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Account created. Check your email to confirm your address before signing in.");
        navigate({ to: "/auth", search: { mode: "signin" } });
      } else {
        const parsed = signinSchema.safeParse(form);
        if (!parsed.success) {
          const errs: Record<string, string> = {};
          parsed.error.errors.forEach((er) => { errs[er.path[0] as string] = er.message; });
          setErrors(errs);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Please confirm your email before signing in.");
          } else if (error.message.toLowerCase().includes("invalid")) {
            toast.error("Invalid email or password.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      toast.error("Google sign-in failed");
      setSubmitting(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-6 md:p-8 shadow-elevated">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-hero text-primary-foreground font-bold mb-3">T</div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignup ? "Join TUSCUSA" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignup ? "Create your member account" : "Sign in to your account"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={onGoogle}
            disabled={submitting}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or with email</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  required
                  maxLength={100}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              {isSignup && !errors.password && (
                <p className="text-xs text-muted-foreground">At least 8 characters, with uppercase, lowercase, and a number.</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>Already have an account?{" "}
                <Link to="/auth" search={{ mode: "signin" }} className="text-primary font-medium hover:underline">Sign in</Link>
              </>
            ) : (
              <>New to TUSCUSA?{" "}
                <Link to="/auth" search={{ mode: "signup" }} className="text-primary font-medium hover:underline">Create an account</Link>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
