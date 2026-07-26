import { useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage } from "@/pages/AuthPage";
import { AppShell } from "@/components/AppShell";
import { Feather } from "lucide-react";

type View = "landing" | "signup" | "signin" | "app";

function AppRoutes() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>("landing");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ border: "1px solid var(--border)", color: "var(--accent)" }}
          >
            <Feather size={26} strokeWidth={1.5} />
          </div>
          <span className="ink-logotype text-sm" style={{ color: "var(--text-faint)" }}>
            INKREAL
          </span>
        </div>
      </div>
    );
  }

  if (session) {
    return <AppShell />;
  }

  if (view === "signup") {
    return <AuthPage initialMode="signup" onBack={() => setView("landing")} />;
  }
  if (view === "signin") {
    return <AuthPage initialMode="signin" onBack={() => setView("landing")} />;
  }
  return <LandingPage onNavigate={(r) => setView(r)} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
