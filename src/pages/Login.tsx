import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Enter your email address", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "A password reset link has been sent." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setSubmitting(false);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Check your email",
          description: "A confirmation link has been sent to verify your account.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/dashboard");
      }
    }
  };

  const pageTitle = forgotPassword
    ? "Reset password"
    : isSignUp
      ? "Create your account"
      : "Sign in";

  const pageSubtitle = forgotPassword
    ? "Enter your email and we'll send you a secure reset link."
    : isSignUp
      ? "Get the morning email with confirmed edges and CLV signals."
      : "Access your dashboard with your verified email and password.";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Helmet>
        <title>{pageTitle} — doctore</title>
        <meta
          name="description"
          content="Sign in or create an account to access the doctore dashboard with confirmed betting edges and CLV tracking."
        />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://doctore-ai.com/login" />
      </Helmet>

      {/* Ambient background — pure CSS, zero asset cost */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[20rem] w-[20rem] translate-x-1/4 translate-y-1/4 rounded-full bg-accent/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="min-h-screen flex flex-col">
        {/* Top nav */}
        <header className="px-5 sm:px-8 py-5 sm:py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </header>

        {/* Card */}
        <main className="flex-1 flex items-center justify-center px-5 pb-12">
          <div className="w-full max-w-[26rem] animate-fade-in">
            <div className="mb-8 text-center">
              <Link
                to="/"
                className="inline-block text-sm font-medium tracking-wide text-foreground/70 hover:text-foreground transition-colors mb-6"
              >
                doctore
              </Link>
              <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground leading-tight">
                {pageTitle}
              </h1>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed max-w-[34ch] mx-auto">
                {pageSubtitle}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-sm p-6 sm:p-7 transition-all">
              {forgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-xs font-medium text-foreground/80">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="pl-9 h-11"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={submitting}>
                    {submitting ? "Sending…" : "Send reset link"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setForgotPassword(false)}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="pl-9 h-11"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
                        Password
                      </Label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => setForgotPassword(true)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        className="pl-9 h-11"
                        placeholder={isSignUp ? "At least 6 characters" : "Your password"}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 transition-transform hover:-translate-y-0.5"
                    disabled={submitting}
                  >
                    {submitting ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
                  </Button>
                </form>
              )}
            </div>

            {!forgotPassword && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-medium text-foreground hover:underline underline-offset-4"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            )}

            <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground/60 max-w-[36ch] mx-auto">
              Informational tool, not betting advice. By continuing, you agree to our{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-muted-foreground">
                Terms
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;