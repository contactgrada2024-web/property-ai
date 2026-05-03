import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, Building2, CheckCircle2, Zap, Chrome } from "lucide-react";

type Tab = "signin" | "signup";

function FieldInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  icon,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  icon: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full bg-card/50 border border-border/60 rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50 font-mono"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { enterDemoMode } = useAuth();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);

  function clearForm() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSignedUp(false);
  }

  function switchTab(next: Tab) {
    setTab(next);
    clearForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (tab === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) {
          setError(error.message);
        } else {
          setSignedUp(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        },
      });
      if (error) setError(error.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(215 25% 15% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(215 25% 15% / 0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg tracking-tight">
            <span className="text-foreground">Property</span>
            <span className="text-primary">AI</span>
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          Terminal v1.0 // Secure
        </span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-4"
        >
          {/* Card */}
          <div className="bg-card/40 border border-border/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Tabs */}
            <div className="flex border-b border-border/50">
              {(["signin", "signup"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  data-testid={`tab-${t}`}
                  className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-widest transition-all ${
                    tab === t
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <div className="p-7 space-y-6">
              {/* Heading */}
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {tab === "signin" ? "Welcome back" : "Get started"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {tab === "signin"
                    ? "Sign in to access your property portfolio."
                    : "Create an account to start analysing properties."}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {signedUp ? (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 py-4"
                  >
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                    <div>
                      <p className="font-semibold text-foreground">Check your email</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        We sent a confirmation link to <span className="text-primary font-mono">{email}</span>.
                        Click it to activate your account, then sign in.
                      </p>
                    </div>
                    <button
                      onClick={() => switchTab("signin")}
                      className="text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      Back to Sign In
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key={tab}
                    initial={{ opacity: 0, x: tab === "signin" ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    noValidate
                  >
                    <FieldInput
                      id="email"
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="you@example.com"
                      disabled={loading}
                      autoComplete="email"
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <FieldInput
                      id="password"
                      label="Password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      disabled={loading}
                      autoComplete={tab === "signin" ? "current-password" : "new-password"}
                      icon={<Lock className="h-4 w-4" />}
                    />
                    {tab === "signup" && (
                      <FieldInput
                        id="confirm-password"
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="••••••••"
                        disabled={loading}
                        autoComplete="new-password"
                        icon={<Lock className="h-4 w-4" />}
                      />
                    )}

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2"
                          data-testid="auth-error"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading}
                      data-testid="btn-submit"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {tab === "signin" ? "Sign In" : "Create Account"}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                      {tab === "signin" ? (
                        <>
                          No account?{" "}
                          <button type="button" onClick={() => switchTab("signup")} className="text-primary underline underline-offset-2 hover:opacity-80">
                            Create one
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{" "}
                          <button type="button" onClick={() => switchTab("signin")} className="text-primary underline underline-offset-2 hover:opacity-80">
                            Sign in
                          </button>
                        </>
                      )}
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-3 px-7 py-2">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono">or</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {/* Google OAuth Button */}
            <div className="px-7 pb-7">
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-border/60 bg-card/50 text-foreground font-semibold text-sm hover:border-primary/40 hover:bg-card/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="h-4 w-4" />
                )}
                Continue with Google
              </motion.button>
            </div>
          </div>

          {/* Try Demo */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono">or</span>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          <motion.button
            onClick={enterDemoMode}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            data-testid="btn-try-demo"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all shadow-sm"
          >
            <Zap className="h-4 w-4" />
            Try Demo — no account needed
          </motion.button>

          <p className="text-center text-[10px] text-muted-foreground/50">
            PropertyAI · All data stays in your browser · Not financial advice
          </p>
        </motion.div>
      </main>
    </div>
  );
}
