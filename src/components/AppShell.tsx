import { useMemo, useState } from "react";
import {
  Home,
  Compass,
  Feather,
  Bookmark,
  Users,
  User as UserIcon,
  Search,
  MessageSquare,
  PenTool,
  Wallet,
  Bell,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreateMenu, type ContentType } from "@/components/CreateMenu";
import { useAuth } from "@/context/AuthContext";
import { ScreenRouter, type ScreenId } from "@/pages/screens";

const MOBILE_NAV: { id: ScreenId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "studio", label: "Create", icon: Feather },
  { id: "library", label: "Library", icon: Bookmark },
  { id: "communities", label: "Communities", icon: Users },
  { id: "profile", label: "Profile", icon: UserIcon },
];

const DESKTOP_NAV: { id: ScreenId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "search", label: "Search", icon: Search },
  { id: "library", label: "Library", icon: Bookmark },
  { id: "communities", label: "Communities", icon: Users },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "studio", label: "Studio", icon: PenTool },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [studioType, setStudioType] = useState<ContentType>("post");
  const { profile, isFounder, isWriter, signOut } = useAuth();

  const roleLabel = useMemo(() => {
    if (isFounder) return "Founder";
    if (isWriter) return "Writer";
    return "Reader";
  }, [isFounder, isWriter]);

  const navigate = (id: ScreenId) => setScreen(id);

  const openCreateMenu = () => setCreateMenuOpen(true);
  const handleCreateSelect = (type: ContentType) => {
    setStudioType(type);
    setScreen("studio");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <span className="ink-logotype text-lg" style={{ color: "var(--text)" }}>
            INKREAL
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {DESKTOP_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`ink-nav-item w-full ${screen === id ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Create (quill) CTA */}
        <div className="px-3 pb-3">
          <button
            onClick={openCreateMenu}
            className="ink-btn-primary w-full"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Feather size={16} />
            Create
          </button>
        </div>

        {/* Profile + theme + sign out */}
        <div className="border-t px-3 py-4" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => navigate("profile")}
            className="ink-nav-item w-full"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: "var(--bg-elevated)", color: "var(--accent)" }}
            >
              {(profile?.display_name ?? profile?.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                {profile?.display_name ?? "Your profile"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                {roleLabel}
              </div>
            </div>
          </button>
          <div className="mt-2 flex items-center justify-between px-2">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 text-xs transition-colors"
              style={{ color: "var(--text-faint)" }}
              aria-label="Sign out"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — offset for sidebar on desktop */}
      <div className="lg:pl-64">
        {/* Desktop top bar */}
        <header
          className="sticky top-0 z-20 hidden items-center justify-end px-8 py-4 backdrop-blur-md lg:flex"
          style={{ backgroundColor: "color-mix(in srgb, var(--bg) 80%, transparent)", borderBottom: "1px solid var(--border)" }}
        >
          <ThemeToggle />
        </header>

        <main className="mx-auto max-w-3xl px-0 pb-28 pt-4 lg:px-8 lg:pb-12">
          <ScreenRouter
            screen={screen}
            onNavigate={navigate}
            studioType={studioType}
            onCreate={openCreateMenu}
          />
        </main>
      </div>

      <CreateMenu
        open={createMenuOpen}
        onClose={() => setCreateMenuOpen(false)}
        onSelect={handleCreateSelect}
      />

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t lg:hidden"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface) 92%, transparent)",
          borderColor: "var(--border)",
          backdropFilter: "blur(12px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {MOBILE_NAV.map(({ id, label, icon: Icon }) => {
          const active = screen === id;
          const isCreate = id === "studio";
          return (
            <button
              key={id}
              onClick={() => (isCreate ? openCreateMenu() : navigate(id))}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}
              aria-label={label}
            >
              {isCreate ? (
                <span
                  className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--bg)",
                    boxShadow: "0 8px 24px -6px color-mix(in srgb, var(--accent) 60%, transparent)",
                  }}
                >
                  <Feather size={22} strokeWidth={1.75} />
                </span>
              ) : (
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              )}
              <span className="text-[10px] font-medium" style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
