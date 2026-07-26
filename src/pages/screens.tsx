import { useEffect, useState } from "react";
import {
  Home,
  Compass,
  Search,
  Bookmark,
  Users,
  MessageSquare,
  PenTool,
  Wallet,
  Bell,
  Settings as SettingsIcon,
  Feather,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type ScreenId =
  | "home"
  | "discover"
  | "search"
  | "library"
  | "communities"
  | "messages"
  | "studio"
  | "wallet"
  | "notifications"
  | "settings"
  | "profile";

interface ScreenProps {
  onNavigate: (id: ScreenId) => void;
}

// ---- Home: real feed count from feed_index ----
function HomeScreen() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setCount(0);
      return;
    }
    (async () => {
      try {
        const { count } = await supabase
          .from("feed_index")
          .select("id", { count: "exact", head: true });
        setCount(count ?? 0);
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScreenShell title="Home">
      <EmptyState
        icon={Home}
        title={loading ? "Loading your feed" : "Your feed is quiet for now"}
        description={
          loading
            ? "Fetching the latest from INKREAL..."
            : count === 0
              ? "No stories have been published yet. Be the first to put something into the world — your feed will fill as writers share their work."
              : "Stories are being written. Follow writers to shape what appears here."
        }
      />
    </ScreenShell>
  );
}

// ---- Discover: real feed count, exploration framing ----
function DiscoverScreen() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setCount(0);
      return;
    }
    (async () => {
      try {
        const { count } = await supabase
          .from("feed_index")
          .select("id", { count: "exact", head: true });
        setCount(count ?? 0);
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScreenShell title="Discover">
      <EmptyState
        icon={Compass}
        title={loading ? "Exploring INKREAL" : "Nothing to discover yet"}
        description={
          loading
            ? "Looking for stories, poems, and books across INKREAL..."
            : count === 0
              ? "No published work exists on INKREAL yet. The discover feed will surface posts, poems, and books the moment they go live."
              : "New work is appearing. Discover surfaces everything published across INKREAL."
        }
      />
    </ScreenShell>
  );
}

// ---- Search ----
function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);

  async function runSearch(q: string) {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    if (!supabase) {
      setResults(0);
      setSearching(false);
      return;
    }
    try {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .ilike("display_name", `%${q}%`);
      setResults(count ?? 0);
    } catch {
      setResults(0);
    }
    setSearching(false);
  }

  return (
    <ScreenShell title="Search">
      <div className="px-6 pt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            runSearch(e.target.value);
          }}
          className="ink-input"
          placeholder="Search writers by name..."
        />
      </div>
      {query.trim() === "" ? (
        <EmptyState
          icon={Search}
          title="Find writers and readers"
          description="Search for people by display name. As the community grows, you'll find writers to follow and readers who share your taste."
        />
      ) : searching ? (
        <EmptyState icon={Search} title="Searching..." description={`Looking for "${query}"`} />
      ) : results === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description={`No writers named "${query}" yet. Try a different name, or come back as the community grows.`}
        />
      ) : (
        <EmptyState
          icon={Search}
          title={`${results} result${results === 1 ? "" : "s"}`}
          description={`Found ${results} writer${results === 1 ? "" : "s"} matching "${query}". Full results arrive in a later phase.`}
        />
      )}
    </ScreenShell>
  );
}

// ---- Library: real saved count ----
function LibraryScreen() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      setCount(0);
      return;
    }
    (async () => {
      try {
        const { count } = await supabase
          .from("saves")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        setCount(count ?? 0);
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <ScreenShell title="Library">
      <EmptyState
        icon={Bookmark}
        title={loading ? "Loading your library" : count === 0 ? "Your library is empty" : "Saved work"}
        description={
          loading
            ? "Fetching everything you've saved..."
            : count === 0
              ? "Stories, poems, and books you save will be kept here for later reading. Tap the bookmark on any piece to add it."
              : `You've saved ${count} piece${count === 1 ? "" : "s"}. Full library browsing arrives in a later phase.`
        }
      />
    </ScreenShell>
  );
}

// ---- Communities ----
function CommunitiesScreen() {
  return (
    <ScreenShell title="Communities">
      <EmptyState
        icon={Users}
        title="Communities are coming"
        description="Gathered spaces for writers and readers will form here — grouped by genre, form, and shared interest. This foundation is built; the rooms open in a later phase."
      />
    </ScreenShell>
  );
}

// ---- Messages ----
function MessagesScreen() {
  return (
    <ScreenShell title="Messages">
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Direct messages between writers and readers will live here. This area is part of a later phase."
      />
    </ScreenShell>
  );
}

// ---- Studio ----
function StudioScreen() {
  const { isWriter } = useAuth();
  return (
    <ScreenShell title="Studio">
      <EmptyState
        icon={PenTool}
        title={isWriter ? "Your writing studio" : "Your studio awaits"}
        description={
          isWriter
            ? "The manuscript editor, drafts, and publishing tools are part of a later phase. Your writer role is active."
            : "The full writing studio — editor, drafts, and one-tap publish — arrives in a later phase. Publish your first piece to become a writer automatically."
        }
      />
    </ScreenShell>
  );
}

// ---- Wallet ----
function WalletScreen() {
  return (
    <ScreenShell title="Wallet">
      <EmptyState
        icon={Wallet}
        title="Wallet not enabled"
        description="Earnings, payouts, and payment history will appear here once payments launch in a later phase."
      />
    </ScreenShell>
  );
}

// ---- Notifications: real unread count ----
function NotificationsScreen() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      setCount(0);
      return;
    }
    (async () => {
      try {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false);
        setCount(count ?? 0);
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <ScreenShell title="Notifications">
      <EmptyState
        icon={Bell}
        title={loading ? "Loading notifications" : count === 0 ? "You're all caught up" : "Notifications"}
        description={
          loading
            ? "Checking for new activity..."
            : count === 0
              ? "No new notifications. You'll be notified here when someone likes or comments on your work."
              : `You have ${count} unread notification${count === 1 ? "" : "s"}.`
        }
      />
    </ScreenShell>
  );
}

// ---- Settings ----
function SettingsScreen() {
  const { profile } = useAuth();
  return (
    <ScreenShell title="Settings">
      <div className="px-6 pt-6">
        <div className="ink-card p-6">
          <h3 className="text-lg" style={{ color: "var(--text)" }}>
            Profile
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>Email</dt>
              <dd style={{ color: "var(--text)" }}>{profile?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>Role</dt>
              <dd className="capitalize" style={{ color: "var(--accent)" }}>
                {profile?.role ?? "reader"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>Display name</dt>
              <dd style={{ color: "var(--text)" }}>{profile?.display_name ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>Language</dt>
              <dd style={{ color: "var(--text)" }}>{profile?.preferred_language ?? "en"}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>Currency</dt>
              <dd style={{ color: "var(--text)" }}>{profile?.preferred_currency ?? "USD"}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-6">
        <EmptyState
          icon={SettingsIcon}
          title="More settings coming"
          description="Account, privacy, and notification preferences will be fully editable here in a later phase."
        />
      </div>
    </ScreenShell>
  );
}

// ---- Profile: real counts from the database ----
function ProfileScreen() {
  const { user, profile, isWriter, isFounder } = useAuth();
  const [postCount, setPostCount] = useState<number | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      setPostCount(0);
      setFollowerCount(0);
      setFollowingCount(0);
      return;
    }
    Promise.all([
      supabase.from("feed_index").select("id", { count: "exact", head: true }).eq("creator_id", user.id),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
    ])
      .then(([posts, followers, following]) => {
        setPostCount(posts.count ?? 0);
        setFollowerCount(followers.count ?? 0);
        setFollowingCount(following.count ?? 0);
        setLoading(false);
      })
      .catch(() => {
        setPostCount(0);
        setFollowerCount(0);
        setFollowingCount(0);
        setLoading(false);
      });
  }, [user]);

  const roleLabel = isFounder ? "Founder" : isWriter ? "Writer" : "Reader";

  return (
    <ScreenShell title="Profile">
      <div className="px-6 pt-6">
        <div className="ink-card overflow-hidden">
          <div className="h-24" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--bg-elevated) 100%)", opacity: 0.5 }} />
          <div className="px-6 pb-6">
            <div
              className="-mt-10 mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full text-2xl"
              style={{ border: "3px solid var(--surface)", backgroundColor: "var(--bg-elevated)", color: "var(--accent)" }}
            >
              {(profile?.display_name ?? profile?.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl" style={{ color: "var(--text)" }}>
              {profile?.display_name ?? "Unnamed writer"}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              {profile?.email}
            </p>
            <div className="mt-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)" }}
              >
                {isFounder && <Sparkles size={12} />}
                {roleLabel}
              </span>
            </div>
            {profile?.bio && (
              <p className="mt-4 text-sm text-pretty" style={{ color: "var(--text-muted)" }}>
                {profile.bio}
              </p>
            )}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6" style={{ borderColor: "var(--border)" }}>
              <Stat label="Published" value={loading ? "—" : postCount} />
              <Stat label="Followers" value={loading ? "—" : followerCount} />
              <Stat label="Following" value={loading ? "—" : followingCount} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <EmptyState
          icon={BookOpen}
          title={postCount === 0 ? "No published work yet" : "Your published work"}
          description={
            postCount === 0
              ? "When you publish your first piece, it will appear here — and your role will become Writer automatically."
              : "A dedicated profile feed arrives in a later phase."
          }
        />
      </div>
    </ScreenShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="text-center">
      <div className="text-xl" style={{ color: "var(--text)", fontFamily: '"Cormorant Garamond", serif' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
    </div>
  );
}

function ScreenShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <div className="px-6 pt-6">
        <h1
          className="text-3xl"
          style={{ color: "var(--text)", fontFamily: '"Cormorant Garamond", serif' }}
        >
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}

export function ScreenRouter({ screen, onNavigate }: { screen: ScreenId; onNavigate: (id: ScreenId) => void }) {
  switch (screen) {
    case "home":
      return <HomeScreen />;
    case "discover":
      return <DiscoverScreen />;
    case "search":
      return <SearchScreen />;
    case "library":
      return <LibraryScreen />;
    case "communities":
      return <CommunitiesScreen />;
    case "messages":
      return <MessagesScreen />;
    case "studio":
      return <StudioScreen />;
    case "wallet":
      return <WalletScreen />;
    case "notifications":
      return <NotificationsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "profile":
      return <ProfileScreen />;
    default:
      return <HomeScreen />;
  }
}

export type { ScreenId };
export { Feather };
