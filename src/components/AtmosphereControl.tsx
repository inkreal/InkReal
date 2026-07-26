import { Volume2, VolumeX, Music } from "lucide-react";

interface AtmosphereControlProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  activeMood: string;
}

export function AtmosphereControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  activeMood,
}: AtmosphereControlProps) {
  const playing = activeMood !== "silence";
  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-full border px-5 py-3 transition-all duration-500"
      style={{
        borderColor: "var(--border)",
        backgroundColor: playing ? "var(--surface)" : "transparent",
        opacity: playing ? 1 : 0.75,
      }}
    >
      <button
        onClick={onToggleMute}
        className="flex-shrink-0 transition-colors"
        style={{ color: muted ? "var(--text-faint)" : "var(--accent)" }}
        aria-label={muted ? "Unmute ambient audio" : "Mute ambient audio"}
        aria-pressed={muted}
      >
        {muted ? <VolumeX size={18} strokeWidth={1.5} /> : <Volume2 size={18} strokeWidth={1.5} />}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={effectiveVolume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="ink-slider flex-1"
        aria-label="Ambient audio volume"
        disabled={!playing}
      />

      <div
        className="flex flex-shrink-0 items-center gap-2 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <Music size={13} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
        <span className="capitalize">{playing ? activeMood : "Silence"}</span>
      </div>
    </div>
  );
}
