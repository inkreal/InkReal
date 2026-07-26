import { useEffect, useRef } from "react";
import type { ParticleKind } from "@/lib/livingEnvironment";

interface EnvironmentParticlesProps {
  kind: ParticleKind;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  alpha: number;
  hue: number;
}

const KIND_COLORS: Record<Exclude<ParticleKind, "none">, string> = {
  petals: "#f4c2cc",
  leaves: "#c97a3d",
  snow: "#ffffff",
  fireflies: "#e6ad3b",
};

export function EnvironmentParticles({ kind }: EnvironmentParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (kind === "none") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    const count =
      kind === "fireflies" ? 28 : kind === "snow" ? 80 : kind === "leaves" ? 26 : 30;
    const color = KIND_COLORS[kind];

    const particles: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (kind === "snow" ? 0.4 : 0.6),
      vy:
        kind === "fireflies"
          ? (Math.random() - 0.5) * 0.2
          : kind === "snow"
            ? 0.4 + Math.random() * 0.6
            : 0.3 + Math.random() * 0.5,
      size: kind === "fireflies" ? 2 + Math.random() * 2 : 3 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.02,
      alpha:
        kind === "fireflies"
          ? 0.4 + Math.random() * 0.5
          : kind === "snow"
            ? 0.5 + Math.random() * 0.4
            : 0.35 + Math.random() * 0.4,
      hue: 0,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.016;

      for (const p of particles) {
        // Sway via sine for organic drift (leaves/petals/snow)
        p.x += p.vx + Math.sin(t + p.y * 0.01) * (kind === "fireflies" ? 0 : 0.4);
        p.y += p.vy;
        p.rot += p.vrot;

        if (kind === "fireflies") {
          // Fireflies drift slowly and pulse brightness
          p.x += Math.sin(t * 0.5 + p.y * 0.02) * 0.3;
          p.y += Math.cos(t * 0.3 + p.x * 0.02) * 0.2;
          p.alpha = 0.3 + Math.abs(Math.sin(t * 1.2 + p.x * 0.05)) * 0.5;
        }

        // Recycle off-screen
        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (kind === "fireflies" && (p.y < -10 || p.y > height + 10)) {
          p.y = Math.random() * height;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        if (kind === "fireflies") {
          // Soft glowing dot
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3);
          grad.addColorStop(0, color);
          grad.addColorStop(1, "rgba(230,173,59,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "snow") {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Petal / leaf — small ellipse
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [kind]);

  if (kind === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden="true"
    />
  );
}
