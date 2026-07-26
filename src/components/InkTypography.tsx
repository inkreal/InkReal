import { useEffect, useRef, useState } from "react";

interface InkBleedWordProps {
  text: string;
  delay?: number;
}

/**
 * Reveals a single word with an ink-writing-itself effect: the letters
 * fade in left-to-right with a soft bleed, as if being written in ink.
 * Falls back to a simple fade when prefers-reduced-motion is set.
 */
export function InkBleedWord({ text, delay = 0 }: InkBleedWordProps) {
  const [reduce, setReduce] = useState(false);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (reduce) {
    return (
      <em ref={ref} style={{ fontStyle: "italic", color: "var(--text)" }}>
        {text}
      </em>
    );
  }

  return (
    <em ref={ref} style={{ fontStyle: "italic", color: "var(--text)", position: "relative" }}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="ink-letter"
          style={{
            opacity: started ? undefined : 0,
            animationDelay: `${delay + i * 90}ms`,
            display: "inline-block",
          }}
        >
          {ch}
        </span>
      ))}
    </em>
  );
}

interface InkQuoteProps {
  quote: string;
  author: string;
  delay?: number;
}

/**
 * Reveals the founder quote with a soft ink-bleed fade — the whole quote
 * fades and lifts gently rather than letter-by-letter, to stay elegant.
 */
export function InkQuote({ quote, author, delay = 0 }: InkQuoteProps) {
  const [reduce, setReduce] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    const t = window.setTimeout(() => setShown(true), delay);
    return () => {
      clearTimeout(t);
      mq.removeEventListener("change", onChange);
    };
  }, [delay]);

  return (
    <blockquote
      style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontStyle: "italic",
        fontSize: "clamp(1.05rem, 2.5vw, 1.25rem)",
        lineHeight: 1.6,
        color: "var(--text-muted)",
        opacity: shown ? 1 : 0,
        transition: reduce ? "none" : "opacity 1.4s ease, filter 1.4s ease",
        filter: shown ? "blur(0)" : "blur(3px)",
      }}
    >
      &ldquo;{quote}&rdquo;
      <footer
        className="mt-2 not-italic text-xs tracking-widest"
        style={{ color: "var(--text-faint)" }}
      >
        &mdash; {author}
      </footer>
    </blockquote>
  );
}
