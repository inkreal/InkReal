/**
 * LivingEnvironment — computes real environmental context (time of day,
 * season adjusted for the visitor's hemisphere) and exposes the visual
 * parameters the page uses to tint the background and render particles.
 */

export type TimePhase = "dawn" | "morning" | "midday" | "golden" | "dusk" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type ParticleKind = "petals" | "leaves" | "snow" | "fireflies" | "none";

export interface EnvironmentContext {
  phase: TimePhase;
  season: Season;
  particleKind: ParticleKind;
  /** warm overlay color for the background tint */
  tint: string;
  /** tint opacity 0–1 */
  tintOpacity: number;
  greeting: string;
}

function getPhase(hour: number): TimePhase {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "midday";
  if (hour >= 16 && hour < 19) return "golden";
  if (hour >= 19 && hour < 21) return "dusk";
  return "night";
}

/** Northern/southern hemisphere season from month + lat sign. */
function getSeason(month: number, northern: boolean): Season {
  const m = month;
  if (northern) {
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  }
  // Southern hemisphere — flip
  if (m >= 2 && m <= 4) return "autumn";
  if (m >= 5 && m <= 7) return "winter";
  if (m >= 8 && m <= 10) return "spring";
  return "summer";
}

export function getEnvironmentContext(date: Date = new Date()): EnvironmentContext {
  const hour = date.getHours();
  const phase = getPhase(hour);
  const month = date.getMonth();
  // Best-effort hemisphere from timezone abbreviation; default northern.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const northern = !tz.includes("Australia") && !tz.includes("Pacific/Auckland");
  const season = getSeason(month, northern);

  const particleKind: ParticleKind =
    season === "autumn"
      ? "leaves"
      : season === "winter"
        ? "snow"
        : season === "spring"
          ? "petals"
          : phase === "night"
            ? "fireflies"
            : "none";

  const tints: Record<TimePhase, { tint: string; opacity: number }> = {
    dawn: { tint: "#f4b860", opacity: 0.06 },
    morning: { tint: "#ffffff", opacity: 0.02 },
    midday: { tint: "#ffffff", opacity: 0.01 },
    golden: { tint: "#e89a3c", opacity: 0.08 },
    dusk: { tint: "#c9622d", opacity: 0.07 },
    night: { tint: "#1a1a2e", opacity: 0.12 },
  };

  const greetings: Record<TimePhase, string> = {
    dawn: "GOOD MORNING",
    morning: "GOOD MORNING",
    midday: "GOOD AFTERNOON",
    golden: "GOOD AFTERNOON",
    dusk: "GOOD EVENING",
    night: "GOOD NIGHT",
  };

  const t = tints[phase];
  return {
    phase,
    season,
    particleKind,
    tint: t.tint,
    tintOpacity: t.opacity,
    greeting: greetings[phase],
  };
}
