import { useEffect } from "react";
import { Feather, BookText, FileText, Library, X } from "lucide-react";

export type ContentType = "poem" | "story" | "post" | "book";

interface CreateMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ContentType) => void;
}

const OPTIONS: { type: ContentType; label: string; description: string; icon: typeof Feather }[] = [
  { type: "poem", label: "Poem", description: "Short-form verse and lyric writing", icon: Feather },
  { type: "story", label: "Story", description: "A longer-form narrative or essay", icon: BookText },
  { type: "post", label: "Post", description: "A quick update, thought, or reflection", icon: FileText },
  { type: "book", label: "Book", description: "A full manuscript with chapters", icon: Library },
];

export function CreateMenu({ open, onClose, onSelect }: CreateMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ backgroundColor: "color-mix(in srgb, var(--text) 40%, transparent)" }}
        onClick={onClose}
      />

      {/* Bottom sheet on mobile, centered modal on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center">
        <div
          className="ink-card w-full overflow-hidden rounded-b-none p-6 lg:w-auto lg:min-w-[420px] lg:rounded-2xl"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2
              className="text-xl"
              style={{ color: "var(--text)", fontFamily: '"Cormorant Garamond", serif' }}
            >
              What are you creating?
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: "var(--text-faint)" }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {OPTIONS.map(({ type, label, description, icon: Icon }) => (
              <button
                key={type}
                onClick={() => {
                  onSelect(type);
                  onClose();
                }}
                className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ border: "1px solid var(--border)" }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
