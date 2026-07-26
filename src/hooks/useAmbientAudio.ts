import { useCallback, useEffect, useRef, useState } from "react";
import { AmbientAudioEngine, type MoodId } from "@/lib/ambientAudio";

const VOLUME_KEY = "inkreal.ambient.volume";
const MUTED_KEY = "inkreal.ambient.muted";

function loadVolume(): number {
  const v = Number(localStorage.getItem(VOLUME_KEY));
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.7;
}
function loadMuted(): boolean {
  return localStorage.getItem(MUTED_KEY) === "1";
}

export function useAmbientAudio() {
  const engineRef = useRef<AmbientAudioEngine | null>(null);
  const [activeMood, setActiveMood] = useState<MoodId>("silence");
  const [volume, setVolumeState] = useState<number>(() => loadVolume());
  const [muted, setMutedState] = useState<boolean>(() => loadMuted());

  // Lazily create the engine (requires window — no SSR here, but be safe)
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new AmbientAudioEngine();
      engineRef.current.setVolume(volume);
      engineRef.current.setMuted(muted);
    }
    return engineRef.current;
  }, [volume, muted]);

  const selectMood = useCallback(
    async (mood: MoodId) => {
      const engine = getEngine();
      await engine.setMood(mood);
      setActiveMood(mood);
    },
    [getEngine],
  );

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem(VOLUME_KEY, String(clamped));
    engineRef.current?.setVolume(clamped);
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    localStorage.setItem(MUTED_KEY, m ? "1" : "0");
    engineRef.current?.setMuted(m);
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return { activeMood, selectMood, volume, setVolume, muted, setMuted };
}
