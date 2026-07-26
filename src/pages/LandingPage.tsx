import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Feather,
  MapPin,
  Clock,
  DollarSign,
  Leaf,
  PenLine,
  BookOpen,
  Users,
  Headphones,
  ShoppingBag,
  BarChart2,
  Globe,
  Sparkles,
  Mic,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { getEnvironmentContext, type ParticleKind } from "@/lib/livingEnvironment";
import { AtmosphereControl } from "@/components/AtmosphereControl";
import { EnvironmentParticles } from "@/components/EnvironmentParticles";
import { InkBleedWord, InkQuote } from "@/components/InkTypography";

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
] as const;

const MOOD_ID_MAP: Record<(typeof MOODS)[number], string> = {
  Silence: "silence",
  Rain: "rain",
  Ocean: "ocean",
  Forest: "forest",
  Fireplace: "fireplace",
  "Coffee Shop": "coffee",
  "Night Writing": "night",
  Classical: "classical",
  "Lo-fi": "lofi",
  Focus: "focus",
};

const FEATURES = [
  {
    icon: PenLine,
    title: "The Writing Room",
    desc: "A quiet, focused space to draft and shape your work — auto-saved as you go.",
  },
  {
    icon: BookOpen,
    title: "The Bookshop",
    desc: "Publish your pages to the world and earn in your local currency.",
  },
  {
    icon: Users,
    title: "The Salon",
    desc: "Gatherings of writers, poets, and storytellers who keep each other going.",
  },
  {
    icon: Headphones,
    title: "The Reading Chair",
    desc: "Listen to narrated works, or lend your voice to narrate your own.",
  },
  {
    icon: ShoppingBag,
    title: "The Marketplace",
    desc: "Books, courses, and exclusive pieces — bought, rented, or subscribed.",
  },
  {
    icon: BarChart2,
    title: "The Reading Room Mirror",
    desc: "See your readers, your reach, and your earnings in honest detail.",
  },
  {
    icon: Globe,
    title: "The Literary Map",
    desc: "Discover writers and stories from every corner of the world.",
  },
  {
    icon: Sparkles,
    title: "The Living World",
    desc: "Seasonal light and ambient sound that shift with the world outside.",
  },
  {
    icon: Mic,
    title: "The Open Mic",
    desc: "A stage for poems, spoken word, and verses meant to be heard.",
  },
];

const PULSE_ITEMS = [
  "A writer just published a poem.",
  "A reader just turned the last page.",
  "A poet shared their first verse.",
  "An audiobook reached a thousand listeners.",
  "A new circle of writers formed.",
  "Someone earned their first dollar from a story.",
  "A midnight chapter was just finished.",
];

function getTimeLabel(): string {
  const h = new Date().getHours();
  if (h >= 0 && h < 5) return "Burning the midnight oil";
  if (h >= 5 && h < 9) return "First light, fresh page";
  if (h >= 9 && h < 12) return "The page is waiting";
  if (h >= 12 && h < 17) return "Midday musings";
  if (h >= 17 && h < 21) return "Golden hour";
  return "Burning the midnight oil";
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function LivePulseTicker() {
  const repeated = [...PULSE_ITEMS, ...PULSE_ITEMS, ...PULSE_ITEMS];
  return (
    <div
      className="relative z-10 overflow-hidden border-y"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center">
        <div
          className="flex-shrink-0 px-4 py-2.5 text-xs font-semibold tracking-widest"
          style={{ backgroundColor: "var(--accent)", color: "#000" }}
        >
          LIVE PULSE
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex animate-ticker gap-8 whitespace-nowrap">
            {repeated.map((item, i) => (
              <span
                key={i}
                className="inline-flex flex-shrink-0 items-center gap-2 px-1 py-2.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                {item}
                <span style={{ color: "var(--border)" }}>·</span>
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
  const { activeMood, selectMood, volume, setVolume, muted, setMuted } = useAmbientAudio();
  const [currentTime, setCurrentTime] = useState(getCurrentTime);

  const env = useMemo(() => getEnvironmentContext(), []);
  const particleKind: ParticleKind = env.particleKind;

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(getCurrentTime()), 30000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = useMemo(() => getTimeLabel(), []);
  const seasonLabel = env.season.charAt(0).toUpperCase() + env.season.slice(1);

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Environmental tint layer */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[2000ms]"
        style={{
          backgroundColor: env.tint,
          opacity: env.tintOpacity,
          mixBlendMode: "soft-light",
        }}
        aria-hidden="true"
      />

      {/* Seasonal / night particles */}
      <EnvironmentParticles kind={particleKind} />

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -left-24 -top-32 h-[40rem] w-[40rem] rounded-full opacity-[0.12] blur-3xl animate-ambient-drift"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-32 top-1/2 h-[36rem] w-[36rem] rounded-full opacity-[0.07] blur-3xl animate-ambient-drift"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            animationDelay: "6s",
          }}
        />
      </div>

      {/* Navbar */}
      <header
        className="relative z-20 flex items-center justify-between px-6 py-4 sm:px-10"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="ink-logotype text-lg tracking-[0.2em]"
          style={{ color: "var(--text)" }}
        >
          InkReal
        </div>
        <nav className="hidden items-center gap-8 sm:flex">
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
            className="rounded-lg px-4 py-1.5 text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="ink-btn-primary px-5 py-2 text-sm"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-10 text-center sm:pt-28">
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
            {seasonLabel}
          </span>
        </div>

        {/* Greeting label */}
        <p
          className="mb-3 text-xs font-semibold tracking-widest opacity-0 animate-fade-up"
          style={{ color: "var(--accent)", animationDelay: "0.1s" }}
        >
          {env.greeting}
        </p>

        {/* Main headline — ink-bleed on "stories" */}
        <h1
          className="opacity-0 animate-fade-up text-balance"
          style={{
            color: "var(--text)",
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: "clamp(3rem, 12vw, 5.5rem)",
            fontWeight: 600,
            lineHeight: 1.08,
            animationDelay: "0.2s",
          }}
        >
          Where <InkBleedWord text="stories" delay={700} /> breathe.
        </h1>

        {/* Atmospheric subheading */}
        <p
          className="mt-5 max-w-xl animate-fade-up text-pretty opacity-0"
          style={{
            color: "var(--text-muted)",
            fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
            lineHeight: 1.7,
            animationDelay: "0.3s",
          }}
        >
          Pull up a chair in the quiet hours. InkReal is a place to write by candlelight,
          to read beneath the sound of rain, and to find the others who keep watch
          over the midnight page.
        </p>

        {/* Founder quote — ink-bleed fade */}
        <div className="mt-8 max-w-lg animate-fade-up opacity-0" style={{ animationDelay: "0.4s" }}>
          <InkQuote
            quote="The sky is not the limit. You limit yourself to the sky."
            author="Jaydin Donough, Founder of InkReal"
            delay={1200}
          />
        </div>

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

      {/* Set the Mood — wired to real ambient audio */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-12 text-center">
        <p
          className="mb-3 text-xs font-semibold tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          SET THE MOOD
        </p>
        <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Choose a sound. Let the room settle around you.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {MOODS.map((mood) => {
            const id = MOOD_ID_MAP[mood];
            const active = activeMood === id;
            return (
              <button
                key={mood}
                onClick={() => selectMood(id as never)}
                className="rounded-full px-4 py-2 text-sm transition-all"
                style={
                  active
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
            );
          })}
        </div>
        <AtmosphereControl
          volume={volume}
          muted={muted}
          onVolumeChange={setVolume}
          onToggleMute={() => setMuted(!muted)}
          activeMood={activeMood}
        />
      </section>

      {/* Live Pulse */}
      <LivePulseTicker />

      {/* Feature cards */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10 text-center">
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
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Nine rooms, one world — each one built around a part of the writing life.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="ink-card p-6 transition-all hover:scale-[1.015]"
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
              <h3 className="mb-1.5 text-base font-semibold" style={{ color: "var(--text)" }}>
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
        className="relative z-10 border-t py-20 text-center"
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
          className="mt-4 mx-auto text-sm"
          style={{ color: "var(--text-muted)", maxWidth: 400 }}
        >
          Free to join. No credit card. Just your voice, and a room waiting for it.
        </p>
        <button onClick={() => onNavigate("signup")} className="ink-btn-primary mt-8 group">
          Create your account
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </section>
    </div>
  );
}
