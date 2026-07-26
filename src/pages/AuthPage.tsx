import { useState, type FormEvent } from "react";
import { Feather, ArrowLeft, MailCheck, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "signin" | "signup" | "forgot" | "check-email";

interface AuthPageProps {
  initialMode: "signin" | "signup";
  onBack: () => void;
}

export function AuthPage({ initialMode, onBack }: AuthPageProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) setError(error);
        else setMode("check-email");
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) setError(error);
        else setSuccess("If an account exists for that email, a reset link is on its way.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] max-w-md flex-col justify-center px-6 pb-16">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--accent)" }}
          >
            <Feather size={24} strokeWidth={1.5} />
          </div>
          <h1 className="ink-logotype text-2xl" style={{ color: "var(--text)" }}>
            INKREAL
          </h1>
        </div>

        {mode === "check-email" ? (
          <div className="ink-card animate-scale-in p-8 text-center">
            <MailCheck size={32} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-2xl" style={{ color: "var(--text)" }}>
              Check your inbox
            </h2>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              We sent a verification link to <strong>{email}</strong>. Confirm your email to finish
              creating your account, then sign in.
            </p>
            <button
              onClick={() => setMode("signin")}
              className="ink-btn-primary mt-6 w-full"
            >
              Continue to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ink-card animate-scale-in space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="text-2xl" style={{ color: "var(--text)" }}>
                {mode === "signin" && "Welcome back"}
                {mode === "signup" && "Create your account"}
                {mode === "forgot" && "Reset your password"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {mode === "signin" && "Sign in to continue to INKREAL."}
                {mode === "signup" && "Every account starts as a reader. Writers are made by publishing."}
                {mode === "forgot" && "Enter your email and we'll send you a reset link."}
              </p>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-lg p-3 text-sm"
                style={{ backgroundColor: "color-mix(in srgb, var(--error) 12%, transparent)", color: "var(--error)" }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                className="flex items-start gap-2 rounded-lg p-3 text-sm"
                style={{ backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)", color: "var(--success)" }}
              >
                <MailCheck size={16} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ink-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text)" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ink-input"
                  placeholder="At least 6 characters"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
            )}

            <button type="submit" disabled={submitting} className="ink-btn-primary w-full">
              {submitting
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>

            <div className="space-y-2 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {mode === "signin" && (
                <>
                  <button type="button" onClick={() => setMode("forgot")} className="hover:underline">
                    Forgot your password?
                  </button>
                  <div>
                    New to INKREAL?{" "}
                    <button type="button" onClick={() => setMode("signup")} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                      Create an account
                    </button>
                  </div>
                </>
              )}
              {mode === "signup" && (
                <div>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setMode("signin")} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                    Sign in
                  </button>
                </div>
              )}
              {mode === "forgot" && (
                <button type="button" onClick={() => setMode("signin")} className="hover:underline">
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Every new account begins as a reader. Publishing your first piece makes you a writer —
          automatically.
        </p>
      </main>
    </div>
  );
}
