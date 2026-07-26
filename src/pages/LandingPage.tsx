import { useMemo, useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Feather,
  PenLine,
  BookOpen,
  Users,
  Headphones,
  ShoppingBag,
  BarChart2,
  Globe,
  Sparkles,
  Mic,
  MapPin,
  Clock,
  DollarSign,
  Leaf,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LandingPageProps {
  onNavigate: (route: "signup" | "signin") => void;
}

const MOODS = [
  "Silence",
  "Rain",
  "Ocean",
  "Forest",
  "Fireplace",
  "Coffee Shop",
  "Night Writing",
  "Classical",
  "Lo-fi",
  "Focus",
];

const FEATURES = [
  {
    icon: PenLine,
    title: "Writing Studio",
    desc: "A focused space to draft, edit, and perfect your craft with auto-save.",
  },
  {
    icon: BookOpen,
    title: "Publish & Sell",
    desc: "Publish books globally and earn in your local currency.",
  },
  {
    icon: Users,
    title: "Communities",
    desc: "Join circles of writers, poets, and storytellers who inspire.",
  },
  {
    icon: Headphones,
    title: "Audio Stories",
    desc: "Listen to narrated works or narrate your own for the world.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    desc: "Buy, rent, or subscribe to books, courses, and exclusive content.",
  },
  {
    icon: BarChart2,
    title: "Creator Analytics",
    desc: "Track your readers, revenue, and reach across the globe.",
  },
  {
    icon: Globe,
    title: "Literary Map",
    desc: "Discover creators and stories from every corner of the world.",
  },
  {
    icon: Sparkles,
    title: "Living Environment",
    desc: "Seasonal animations and ambient sound that match your world.",
  },
  {
    icon: Mic,
    title: "Poetry & Spoken Word",
    desc: "Share poems, spoken word, and verses that move people.",
  },
];

const PULSE_ITEMS = [
  "A writer just published a poem.",
  "A reader just finished a chapter.",
  "A writer just reached 10,000 readers.",
  "An audiobook hit #1 today.",
  "A new community was born.",
  "Someone just earned their first dollar.",
  "A poet shared their first verse.",
];

function getSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "Spring";
  if (m >= 5 && m <= 7) return "Summer";
  if (m >= 8 && m <= 10) return "Autumn";
  return "Winter";
}

function getTimeLabel(): string {
  const h = new Date().getHours();
  if (h >= 0 && h < 5) return "Burning the midnight oil";
  if (h >= 5 && h < 9) return "First light, fresh page";
  if (h >= 9 && h < 12) return "The page is waiting";
  if (h >= 12 && h < 17) return "Midday musings";
  if (h >= 17 && h < 21) return "Golden hour";
  return "Burning the midnight oil";
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  if (h < 21) return "GOOD EVENING";
  return "GOOD NIGHT";
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function LivePulseTicker() {
  const tickerRef = useRef<HTMLDivElement>(null);
  const repeated = [...PULSE_ITEMS, ...PULSE_ITEMS, ...PULSE_ITEMS];

  return (
    <div
      className="relative overflow-hidden border-b"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div className="flex items-center">
        <div
          className="flex-shrink-0 px-4 py-2.5 text-xs font-semibold tracking-widest"
          style={{
            backgroundColor: "var(--accent)",
            color: "#000",
          }}
        >
          LIVE PULSE
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div
            ref={tickerRef}
            className="flex gap-8 animate-ticker whitespace-nowrap"
          >
            {repeated.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 text-xs py-2.5 px-1 flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { session } = useAuth();
  const [activeMood, setActiveMood] = useState("Silence");
  const [currentTime, setCurrentTime] = useState(getCurrentTime);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(getCurrentTime()), 30000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = useMemo(() => getTimeLabel(), []);
  const season = useMemo(() => getSeason(), []);
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-24 h-[40rem] w-[40rem] rounded-full opacity-[0.12] blur-3xl animate-ambient-drift"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-32 h-[36rem] w-[36rem] rounded-full opacity-[0.07] blur-3xl animate-ambient-drift"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", animationDelay: "6s" }}
        />
      </div>

      {/* Navbar */}
      <header
        className="relative z-20 flex items-center justify-between px-6 py-4 sm:px-10 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="ink-logotype text-lg tracking-[0.2em]"
          style={{ color: "var(--text)" }}
        >
          InkReal
        </div>
        <nav className="hidden sm:flex items-center gap-8">
          {["Features", "Docs", "Discover"].map((item) => (
            <button
              key={item}
              className="text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("signin")}
            className="text-sm px-4 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="ink-btn-primary text-sm py-2 px-5"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-3xl flex flex-col items-center text-center px-6 pt-20 pb-10 sm:pt-28">
        {/* Context bar */}
        <div
          className="mb-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs animate-fade-in"
          style={{ color: "var(--text-faint)", animationDelay: "0s" }}
        >
          <span className="flex items-center gap-1.5">
            <Feather size={12} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
            {timeLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={12} strokeWidth={1.5} />
            United States
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} strokeWidth={1.5} />
            {currentTime}
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign size={12} strokeWidth={1.5} />
            US Dollar
          </span>
          <span className="flex items-center gap-1.5">
            <Leaf size={12} strokeWidth={1.5} />
            {season}
          </span>
        </div>

        {/* Greeting label */}
        <p
          className="mb-3 text-xs font-semibold tracking-widest animate-fade-up opacity-0"
          style={{ color: "var(--accent)", animationDelay: "0.1s" }}
        >
          {greeting}
        </p>

        {/* Main headline */}
        <h1
          className="animate-fade-up opacity-0 text-balance"
          style={{
            color: "var(--text)",
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: "clamp(3rem, 12vw, 5.5rem)",
            fontWeight: 600,
            lineHeight: 1.08,
            animationDelay: "0.2s",
          }}
        >
          Where{" "}
          <em style={{ fontStyle: "italic", color: "var(--text)" }}>stories</em>{" "}
          breathe.
        </h1>

        {/* Sub-headline */}
        <p
          className="mt-5 max-w-xl animate-fade-up opacity-0 text-pretty"
          style={{
            color: "var(--text-muted)",
            fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
            lineHeight: 1.7,
            animationDelay: "0.3s",
          }}
        >
          InkReal is a living network for readers, writers, and creators — publish, read,
          listen, and connect across regions and currencies.
        </p>

        {/* Founder quote */}
        <blockquote
          className="mt-8 max-w-lg animate-fade-up opacity-0"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: "italic",
            fontSize: "clamp(1.05rem, 2.5vw, 1.25rem)",
            lineHeight: 1.6,
            color: "var(--text-muted)",
            animationDelay: "0.4s",
          }}
        >
          &ldquo;The sky is not the limit. You limit yourself to the sky.&rdquo;
          <footer
            className="mt-2 not-italic text-xs tracking-widest"
            style={{ color: "var(--text-faint)" }}
          >
            &mdash; Jaydin Donough, Founder of InkReal
          </footer>
        </blockquote>

        {/* CTAs */}
        <div
          className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-3 opacity-0"
          style={{ animationDelay: "0.5s" }}
        >
          {session ? (
            <button onClick={() => onNavigate("signin")} className="ink-btn-primary group">
              Enter InkReal
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <>
              <button onClick={() => onNavigate("signup")} className="ink-btn-primary group">
                Start writing
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => onNavigate("signup")} className="ink-btn-ghost">
                Explore
              </button>
            </>
          )}
        </div>
      </section>

      {/* Set the Mood */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-12 text-center">
        <p
          className="mb-6 text-xs font-semibold tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          SET THE MOOD
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setActiveMood(mood)}
              className="rounded-full px-4 py-2 text-sm transition-all"
              style={
                activeMood === mood
                  ? {
                      backgroundColor: "var(--accent)",
                      color: "#000",
                      border: "1px solid var(--accent)",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {mood}
            </button>
          ))}
        </div>
      </section>

      {/* Live Pulse */}
      <LivePulseTicker />

      {/* Feature cards */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-16">
        <div className="text-center mb-10">
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "clamp(2rem, 6vw, 3rem)",
              color: "var(--text)",
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            A Universe for Creators
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Everything you need to write, publish, and share your voice with the world.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-6 transition-all hover:scale-[1.015]"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                  color: "var(--accent)",
                }}
              >
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <h3
                className="mb-1.5 text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className="relative z-10 py-20 text-center border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <p
          className="mb-2 text-xs font-semibold tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          JOIN THE MOVEMENT
        </p>
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: "clamp(2rem, 6vw, 3.25rem)",
            color: "var(--text)",
            fontWeight: 600,
          }}
        >
          Your story starts here.
        </h2>
        <p
          className="mt-4 text-sm"
          style={{ color: "var(--text-muted)", maxWidth: 400, margin: "1rem auto 0" }}
        >
          Free to join. No credit card. Just your voice.
        </p>
        <button
          onClick={() => onNavigate("signup")}
          className="ink-btn-primary mt-8 group"
        >
          Create your account
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </section>
    </div>
  );
}
