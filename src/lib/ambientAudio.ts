/**
 * AmbientAudioEngine — a procedural ambient-sound synthesizer built on the
 * Web Audio API. Every track is generated in real time from filtered noise,
 * oscillators, and amplitude modulation — no external audio files, which means
 * zero licensing constraints and every mood produces real, looping sound.
 *
 * The AudioEngine class manages a single AudioContext, per-mood synth graphs,
 * smooth crossfades when switching moods, and master gain / mute control. It is
 * framework-agnostic; the React layer (useAmbientAudio) wraps it.
 */

export type MoodId =
  | "silence"
  | "rain"
  | "ocean"
  | "forest"
  | "fireplace"
  | "coffee"
  | "night"
  | "classical"
  | "lofi"
  | "focus";

interface ActiveLayer {
  stop: (fadeMs: number) => void;
}

const CROSSFADE_MS = 900;
const MAX_LAYER_GAIN = 0.5;

function createNoiseBuffer(ctx: AudioContext, seconds: number, type: "white" | "brown"): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

function makeNoiseSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function ramp(param: AudioParam, ctx: AudioContext, target: number, fadeMs: number) {
  param.cancelScheduledValues(ctx.currentTime);
  param.setValueAtTime(param.value, ctx.currentTime);
  param.linearRampToValueAtTime(target, ctx.currentTime + fadeMs / 1000);
}

/**
 * Slow melodic/harmonic layer for the "writing mood" tracks (classical, lofi,
 * night). Plays soft sustained chord tones on sine/triangle oscillators with a
 * slow attack, changing chords every 15–30s so it never becomes a tight
 * repeating riff. Mixed quietly beneath the texture layer — an emotional
 * undertone, not a foreground song. Returns a teardown that stops oscillators
 * and clears the chord-change timer.
 */
function buildMelodicLayer(
  ctx: AudioContext,
  dest: AudioNode,
  mood: "classical" | "lofi" | "night",
): () => void {
  // Chord progressions expressed as frequency multipliers from a root.
  const progressions: Record<"classical" | "lofi" | "night", number[][]> = {
    classical: [
      [1, 1.25, 1.5], // I — major
      [1.5, 1.875, 2.25], // V
      [0.9, 1.125, 1.35], // vi
      [1.333, 1.667, 2], // IV
    ],
    lofi: [
      [1, 1.2, 1.5], // minor-ish
      [1.125, 1.35, 1.6875],
      [1.5, 1.8, 2.25],
      [1.333, 1.6, 2],
    ],
    night: [
      [1, 1.2, 1.5], // i (minor)
      [0.667, 0.8, 1], // VI
      [0.75, 0.9, 1.125], // III
      [0.875, 1.05, 1.3125], // VII
    ],
  };
  const roots: Record<"classical" | "lofi" | "night", number> = {
    classical: 261.63, // C4
    lofi: 220, // A3
    night: 196, // G3
  };
  // Quiet — sits beneath the texture, never louder than it.
  const baseGain = 0.04;
  const progression = progressions[mood];
  const root = roots[mood];
  let step = Math.floor(Math.random() * progression.length);
  let timer: number | undefined;
  interface ChordNote {
    osc: OscillatorNode;
    lfo: OscillatorNode;
    gain: GainNode;
  }
  let live: ChordNote[] = [];

  const playChord = (multipliers: number[]) => {
    const t = ctx.currentTime;
    const next: ChordNote[] = [];
    multipliers.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = root * mult;
      // Slight detune so the chord breathes rather than feels static.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.02;
      const detuneGain = ctx.createGain();
      detuneGain.gain.value = 1.5;
      lfo.connect(detuneGain).connect(osc.frequency);
      lfo.start(t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      // Slow attack — gently swells in over ~3s.
      g.gain.linearRampToValueAtTime(baseGain / (i + 1), t + 3);
      osc.connect(g).connect(dest);
      osc.start(t);
      next.push({ osc, lfo, gain: g });
    });
    // Fade out the previous chord over ~3s and stop its nodes.
    const prev = live;
    prev.forEach((n) => {
      ramp(n.gain.gain, ctx, 0, 3000);
      try {
        n.osc.stop(t + 3.2);
      } catch {
        // already stopped
      }
      try {
        n.lfo.stop(t + 3.2);
      } catch {
        // already stopped
      }
    });
    live = next;
  };

  playChord(progression[step]);
  const scheduleNext = () => {
    // 15–30s between chord changes — slow, barely-there movement.
    const delay = 15000 + Math.random() * 15000;
    timer = window.setTimeout(() => {
      step = (step + 1) % progression.length;
      playChord(progression[step]);
      scheduleNext();
    }, delay);
  };
  scheduleNext();

  return () => {
    if (timer) clearTimeout(timer);
    const t = ctx.currentTime;
    live.forEach((n) => {
      ramp(n.gain.gain, ctx, 0, 600);
      try {
        n.osc.stop(t + 0.7);
      } catch {
        // already stopped
      }
      try {
        n.lfo.stop(t + 0.7);
      } catch {
        // already stopped
      }
    });
    live = [];
  };
}

/** Build the synth graph for a mood, returning a layer that can stop with a fade. */
function buildLayer(ctx: AudioContext, mood: Exclude<MoodId, "silence">): ActiveLayer {
  const dest = ctx.createGain();
  dest.gain.value = 0;
  ramp(dest.gain, ctx, MAX_LAYER_GAIN, CROSSFADE_MS);
  dest.connect(ctx.destination);

  const nodes: { stop?: () => void; src?: AudioScheduledSourceNode }[] = [];

  if (mood === "rain") {
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 4, "white"));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 600;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    noise.connect(hp).connect(lp).connect(dest);
    noise.start();
    nodes.push({ src: noise });

    // Occasional heavier drop via LFO on a gain
    const dropGain = ctx.createGain();
    dropGain.gain.value = 0.4;
    dropGain.connect(dest);
    const dropNoise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 3, "white"));
    const dropLp = ctx.createBiquadFilter();
    dropLp.type = "lowpass";
    dropLp.frequency.value = 1800;
    dropNoise.connect(dropLp).connect(dropGain);
    dropNoise.start();
    nodes.push({ src: dropNoise });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain).connect(dropGain.gain);
    lfo.start();
    nodes.push({ src: lfo });
  }

  if (mood === "ocean") {
    // Wave swells via brown noise + slow LFO on lowpass cutoff
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 6, "white"));
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.45;
    noise.connect(lp).connect(waveGain).connect(dest);
    noise.start();
    nodes.push({ src: noise });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    nodes.push({ src: lfo });

    const swellLfo = ctx.createOscillator();
    swellLfo.frequency.value = 0.12;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.25;
    swellLfo.connect(swellGain).connect(waveGain.gain);
    swellLfo.start();
    nodes.push({ src: swellLfo });
  }

  if (mood === "forest") {
    // Wind in leaves — gentle filtered noise
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 5, "brown"));
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200;
    noise.connect(lp).connect(dest);
    noise.start();
    nodes.push({ src: noise });

    const windLfo = ctx.createOscillator();
    windLfo.frequency.value = 0.07;
    const windGain = ctx.createGain();
    windGain.gain.value = 300;
    windLfo.connect(windGain).connect(lp.frequency);
    windLfo.start();
    nodes.push({ src: windLfo });

    // Occasional bird chirps via quick sine blips on a timer
    let chirpTimer: number | undefined;
    const chirp = () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2200 + Math.random() * 800, t);
      osc.frequency.exponentialRampToValueAtTime(1800 + Math.random() * 600, t + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(g).connect(dest);
      osc.start(t);
      osc.stop(t + 0.2);
      chirpTimer = window.setTimeout(chirp, 2000 + Math.random() * 5000);
    };
    chirpTimer = window.setTimeout(chirp, 1500);
    nodes.push({
      stop: () => {
        if (chirpTimer) clearTimeout(chirpTimer);
      },
    });
  }

  if (mood === "fireplace") {
    // Crackling fire — brown noise base + random crackle bursts
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 4, "brown"));
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    const fireGain = ctx.createGain();
    fireGain.gain.value = 0.35;
    noise.connect(lp).connect(fireGain).connect(dest);
    noise.start();
    nodes.push({ src: noise });

    let crackleTimer: number | undefined;
    const crackle = () => {
      const t = ctx.currentTime;
      const burst = makeNoiseSource(ctx, createNoiseBuffer(ctx, 0.08, "white"));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2500 + Math.random() * 2000;
      bp.Q.value = 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      burst.connect(bp).connect(g).connect(dest);
      burst.start(t);
      burst.stop(t + 0.09);
      crackleTimer = window.setTimeout(crackle, 120 + Math.random() * 350);
    };
    crackleTimer = window.setTimeout(crackle, 300);
    nodes.push({
      stop: () => {
        if (crackleTimer) clearTimeout(crackleTimer);
      },
    });
  }

  if (mood === "coffee") {
    // Coffee shop — midrange murmur + occasional cup clinks
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 5, "brown"));
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 600;
    bp.Q.value = 0.5;
    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.3;
    noise.connect(bp).connect(murmurGain).connect(dest);
    noise.start();
    nodes.push({ src: noise });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(murmurGain.gain);
    lfo.start();
    nodes.push({ src: lfo });

    let clinkTimer: number | undefined;
    const clink = () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400 + Math.random() * 600, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(g).connect(dest);
      osc.start(t);
      osc.stop(t + 0.3);
      clinkTimer = window.setTimeout(clink, 4000 + Math.random() * 6000);
    };
    clinkTimer = window.setTimeout(clink, 2500);
    nodes.push({
      stop: () => {
        if (clinkTimer) clearTimeout(clinkTimer);
      },
    });
  }

  if (mood === "night") {
    // Quiet night writing — soft rain + distant clock tick
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 4, "white"));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4000;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.18;
    noise.connect(hp).connect(lp).connect(rainGain).connect(dest);
    noise.start();
    nodes.push({ src: noise });

    let tickTimer: number | undefined;
    const tick = () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.connect(g).connect(dest);
      osc.start(t);
      osc.stop(t + 0.08);
      // Tick every ~2 seconds (distant clock)
      tickTimer = window.setTimeout(tick, 2000);
    };
    tickTimer = window.setTimeout(tick, 1000);
    nodes.push({
      stop: () => {
        if (tickTimer) clearTimeout(tickTimer);
      },
    });

    // Subtle melodic undertone (sits beneath the rain + tick).
    nodes.push({ stop: buildMelodicLayer(ctx, dest, "night") });
  }

  if (mood === "classical") {
    // Soft classical-adjacent drone: root + fifth + octave, slow shimmer
    const base = 261.63; // C4
    const intervals = [1, 1.5, 2];
    intervals.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = base * mult;
      const g = ctx.createGain();
      g.gain.value = 0.12 / (i + 1);
      osc.connect(g).connect(dest);
      osc.start();
      nodes.push({ src: osc });

      // Slow vibrato
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();
      nodes.push({ src: lfo });
    });

    // Subtle melodic undertone (sits beneath the drone).
    nodes.push({ stop: buildMelodicLayer(ctx, dest, "classical") });
  }

  if (mood === "lofi") {
    // Lo-fi: mellow chord + vinyl crackle
    const chord = [220, 277.18, 329.63]; // A minor-ish
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.1 / (i + 1);
      osc.connect(g).connect(dest);
      osc.start();
      nodes.push({ src: osc });
    });

    // Vinyl crackle
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 3, "white"));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3000;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.06;
    noise.connect(hp).connect(crackleGain).connect(dest);
    noise.start();
    nodes.push({ src: noise });

    // Subtle melodic undertone (sits beneath the crackle).
    nodes.push({ stop: buildMelodicLayer(ctx, dest, "lofi") });
  }

  if (mood === "focus") {
    // Low brown-noise drone for concentration
    const noise = makeNoiseSource(ctx, createNoiseBuffer(ctx, 6, "brown"));
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    noise.connect(lp).connect(dest);
    noise.start();
    nodes.push({ src: noise });
  }

  return {
    stop: (fadeMs: number) => {
      ramp(dest.gain, ctx, 0, fadeMs);
      const killAt = ctx.currentTime + fadeMs / 1000 + 0.1;
      nodes.forEach((n) => {
        if (n.src) {
          try {
            n.src.stop(killAt);
          } catch {
            // already stopped
          }
        }
        n.stop?.();
      });
      window.setTimeout(() => dest.disconnect(), fadeMs + 150);
    },
  };
}

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private current: ActiveLayer | null = null;
  private currentMood: MoodId = "silence";
  private masterGain: GainNode | null = null;
  private volume = 0.7;
  private muted = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  get mood(): MoodId {
    return this.currentMood;
  }

  get isPlaying(): boolean {
    return this.currentMood !== "silence" && this.current !== null;
  }

  async setMood(mood: MoodId): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();

    if (mood === this.currentMood) return;
    this.currentMood = mood;

    // Fade out existing layer, then start new (crossfade)
    const prev = this.current;
    if (mood !== "silence") {
      this.current = buildLayer(ctx, mood);
    } else {
      this.current = null;
    }
    if (prev) prev.stop(CROSSFADE_MS);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx && !this.muted) {
      ramp(this.masterGain.gain, this.ctx, this.volume, 120);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      ramp(this.masterGain.gain, this.ctx, muted ? 0 : this.volume, 120);
    }
  }

  stop(): void {
    if (this.current) {
      this.current.stop(CROSSFADE_MS);
      this.current = null;
    }
    this.currentMood = "silence";
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
