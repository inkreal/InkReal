import { useMemo } from "react";
import { ArrowRight, Feather, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getTimeOfDayGreeting } from "@/lib/timeOfDay";
import { useAuth } from "@/context/AuthContext";

interface LandingPageProps {
  onNavigate: (route: "signup" | "signin") => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const greeting = useMemo(() => getTimeOfDayGreeting(), []);
  const { session } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background — cinematic orbs, slow drift */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-24 h-[40rem] w-[40rem] rounded-full opacity-20 blur-3xl animate-ambient-drift"
          style={{
            background:
              "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/3 -right-32 h-[36rem] w-[36rem] rounded-full opacity-10 blur-3xl animate-ambient-drift"
          style={{
            background:
              "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            animationDelay: "6s",
          }}
        />
      </div>

      {/* Top bar — logotype + theme toggle */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
        <div className="ink-logotype text-xl tracking-[0.22em]" style={{ color: "var(--text)" }}>
          INKREAL
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] max-w-4xl flex-col items-center justify-center px-6 text-center">
        {/* Quill mark */}
        <div
          className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl animate-fade-in"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--accent)",
          }}
        >
          <Feather size={28} strokeWidth={1.5} />
        </div>

        {/* Time-of-day greeting */}
        <p
          className="mb-6 text-sm italic animate-fade-up opacity-0"
          style={{ color: "var(--accent)", animationDelay: "0.1s" }}
        >
          {greeting.line}
        </p>

        {/* Logotype */}
        <h1
          className="ink-logotype animate-fade-up opacity-0 text-balance"
          style={{
            color: "var(--text)",
            fontSize: "clamp(3rem, 12vw, 7rem)",
            lineHeight: 1,
            animationDelay: "0.2s",
          }}
        >
          INKREAL
        </h1>

        {/* Tagline */}
        <p
          className="mt-6 animate-fade-up opacity-0 text-pretty"
          style={{
            color: "var(--text-muted)",
            fontSize: "clamp(1.25rem, 3.5vw, 1.75rem)",
            fontFamily: '"Cormorant Garamond", serif',
            animationDelay: "0.3s",
          }}
        >
          Where stories become reality.
        </p>

        {/* Dual CTA */}
        <div
          className="mt-10 flex animate-fade-up flex-col gap-3 opacity-0 sm:flex-row sm:gap-4"
          style={{ animationDelay: "0.4s" }}
        >
          {session ? (
            <button
              onClick={() => onNavigate("signin")}
              className="ink-btn-primary group"
            >
              Enter INKREAL
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate("signup")}
                className="ink-btn-primary group"
              >
                Get Started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => onNavigate("signin")} className="ink-btn-ghost">
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Founder quote — permanent artistic element */}
        <figure
          className="mt-20 max-w-2xl animate-fade-up opacity-0"
          style={{ animationDelay: "0.6s" }}
        >
          <blockquote
            className="text-pretty"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: "italic",
              fontSize: "clamp(1.35rem, 3vw, 1.75rem)",
              lineHeight: 1.5,
              color: "var(--text-muted)",
            }}
          >
            &ldquo;The sky is not the limit. You limit yourself to the sky.&rdquo;
          </blockquote>
          <figcaption
            className="mt-4 text-sm"
            style={{ color: "var(--text-faint)", letterSpacing: "0.08em" }}
          >
            &mdash; Jaydin Donough, Founder
          </figcaption>
        </figure>

        {/* Editorial closing line */}
        <div
          className="mt-16 flex animate-fade-in items-center gap-3 opacity-0"
          style={{ animationDelay: "0.8s", color: "var(--text-faint)" }}
        >
          <BookOpen size={16} strokeWidth={1.5} />
          <span className="text-sm" style={{ letterSpacing: "0.06em" }}>
            A home for writers and readers
          </span>
        </div>
      </main>
    </div>
  );
}
