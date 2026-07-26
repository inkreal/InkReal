import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 animate-fade-in">
      <div
        className="mx-auto flex max-w-md flex-col items-center rounded-2xl px-8 py-12 text-center"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px -12px color-mix(in srgb, var(--accent) 12%, transparent)",
        }}
      >
        <div
          className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
            color: "var(--accent)",
          }}
        >
          <Icon size={28} strokeWidth={1.5} />
        </div>
        <h2
          className="text-2xl text-balance"
          style={{ color: "var(--text)", fontFamily: '"Cormorant Garamond", serif' }}
        >
          {title}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-pretty" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
