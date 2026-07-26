import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import type { Profile, ResolvedRoles, UserRole } from "@/types/database";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isFounder: boolean;
  isWriter: boolean;
  loading: boolean;
  resolving: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [isWriter, setIsWriter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const callResolveRoles = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setRole(null);
      setIsFounder(false);
      setIsWriter(false);
      return;
    }
    setResolving(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-roles`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as ResolvedRoles;
      setRole(data.role);
      setIsFounder(data.is_founder);
      setIsWriter(data.is_writer);
    } catch {
      // Network failure: keep last-known role; do not crash UI.
    } finally {
      setResolving(false);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) {
      setProfile(data as Profile);
    }
  }, []);

  // Initialise session once and subscribe to auth changes.
  useEffect(() => {
    // No client (missing env vars): drop straight out of loading so the app
    // can render its error state instead of hanging on the spinner forever.
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          fetchProfile(data.session.user.id);
          callResolveRoles(data.session);
        }
        setLoading(false);
      })
      .catch(() => {
        // getSession should never reject, but if storage is inaccessible in
        // this environment we still must release the loading state.
        if (mounted) setLoading(false);
      });

    // onAuthStateChange callback runs synchronously; wrap async work to avoid deadlock.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
          await callResolveRoles(newSession);
        } else {
          setProfile(null);
          setRole(null);
          setIsFounder(false);
          setIsWriter(false);
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [callResolveRoles, fetchProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Authentication is not configured." };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Authentication is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setIsFounder(false);
    setIsWriter(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { error: "Authentication is not configured." };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? error.message : null };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [fetchProfile, user]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      isFounder,
      isWriter,
      loading,
      resolving,
      configured: hasSupabaseConfig,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      role,
      isFounder,
      isWriter,
      loading,
      resolving,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
