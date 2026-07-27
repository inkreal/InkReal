import { useEffect, useState, type ReactNode } from "react";
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
  ArrowRight,
  LogOut,
  ChevronRight,
  Pencil,
  Share2,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { AvatarUpload } from "@/components/AvatarUpload";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { ContentType } from "@/components/CreateMenu";

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
  onCreate?: () => void;
}

// ---- Home: real feed from feed_index with creator profiles ----
interface FeedEntry {
  id: string;
  content_type: string;
  source_table: string;
  source_id: string;
  creator_id: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  title?: string;
  creator?: { display_name: string | null; avatar_url: string | null } | null;
}

async function fetchFeed(limit = 20): Promise<FeedEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("feed_index")
    .select("id, content_type, source_table, source_id, creator_id, created_at, like_count, comment_count, view_count, creator:profiles!feed_index_creator_id_fkey(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  const entries = data as unknown as FeedEntry[];

  const postIds = entries.filter((e) => e.source_table === "posts" || e.source_table === "poems").map((e) => e.source_id);
  const bookIds = entries.filter((e) => e.source_table === "books").map((e) => e.source_id);

  const titleMap = new Map<string, string>();
  if (postIds.length > 0) {
    const [posts, poems] = await Promise.all([
      supabase.from("posts").select("id, title").in("id", postIds),
      supabase.from("poems").select("id, title").in("id", postIds),
    ]);
    (posts.data ?? []).forEach((p: { id: string; title: string }) => titleMap.set(p.id, p.title));
    (poems.data ?? []).forEach((p: { id: string; title: string }) => titleMap.set(p.id, p.title));
  }
  if (bookIds.length > 0) {
    const { data: books } = await supabase.from("books").select("id, title").in("id", bookIds);
    (books ?? []).forEach((b: { id: string; title: string }) => titleMap.set(b.id, b.title));
  }

  return entries.map((e) => ({ ...e, title: titleMap.get(e.source_id) ?? "Untitled" }));
}

function contentTypeLabel(type: string): string {
  if (type === "poem") return "Poem";
  if (type === "book") return "Book";
  return "Story";
}

function FeedCard({ item }: { item: FeedEntry }) {
  const name = item.creator?.display_name ?? "Unknown writer";
  const monogram = name.charAt(0).toUpperCase();
  return (
    <article className="ink-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm"
          style={{
            border: "2px solid var(--accent)",
            background: item.creator?.avatar_url
              ? "var(--surface)"
              : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 80%, var(--bg-elevated)), var(--accent))",
            color: "var(--bg)",
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            backgroundImage: item.creator?.avatar_url ? `url(${item.creator.avatar_url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {item.creator?.avatar_url ? "" : monogram}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {name}
          </div>
          <div className="text-xs" style={{ color: "var(--text-faint)" }}>
            {contentTypeLabel(item.content_type)} · {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <h3
        className="text-lg"
        style={{ color: "var(--text)", fontFamily: '"Cormorant Garamond", serif' }}
      >
        {item.title ?? "Untitled"}
      </h3>
      <div className="mt-2 flex gap-4 text-xs" style={{ color: "var(--text-faint)" }}>
        <span>{item.like_count} likes</span>
        <span>{item.comment_count} comments</span>
        <span>{item.view_count} views</span>
      </div>
    </article>
  );
}

function HomeScreen({ onNavigate }: ScreenProps) {
  const [items, setItems] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const feed = await fetchFeed();
      setItems(feed);
      setLoading(false);
    })();
  }, []);

  if (loading || items.length > 0) {
    return (
      <ScreenShell title="Home">
        {loading ? (
          <div className="px-6 py-16 text-center" style={{ color: "var(--text-faint)" }}>
            Loading your feed...
          </div>
        ) : (
          <div className="space-y-4 px-6 py-6">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Home">
      <EmptyState
        icon={Home}
        title="Your feed is quiet for now"
        description="No stories have been published yet. Be the first to put something into the world — your feed will fill as writers share their work."
        action={
          <button onClick={() => onNavigate("discover")} className="ink-btn-primary group">
            Explore Discover
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        }
      />
    </ScreenShell>
  );
}

// ---- Discover: real feed, exploration framing ----
function DiscoverScreen() {
  const [items, setItems] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const feed = await fetchFeed(50);
      setItems(feed);
      setLoading(false);
    })();
  }, []);

  if (loading || items.length > 0) {
    return (
      <ScreenShell title="Discover">
        {loading ? (
          <div className="px-6 py-16 text-center" style={{ color: "var(--text-faint)" }}>
            Exploring INKREAL...
          </div>
        ) : (
          <div className="space-y-4 px-6 py-6">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Discover">
      <EmptyState
        icon={Compass}
        title="Nothing to discover yet"
        description="No published work exists on INKREAL yet. The discover feed will surface posts, poems, and books the moment they go live."
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
function LibraryScreen({ onNavigate }: ScreenProps) {
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
        action={
          !loading && count === 0 && (
            <button onClick={() => onNavigate("discover")} className="ink-btn-primary group">
              Browse Discover to find something to save
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          )
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
function StudioScreen({ studioType }: { studioType: ContentType }) {
  const { isWriter } = useAuth();
  const labels: Record<ContentType, { title: string; desc: string }> = {
    poem: {
      title: "Poem editor",
      desc: "A dedicated verse editor with line-break awareness and stanza tools arrives in the next update. Your writer role is active — publishing your first poem will also promote you to Writer.",
    },
    story: {
      title: "Story editor",
      desc: "The long-form narrative editor with draft history and one-tap publish arrives in the next update. Publish your first story to become a Writer automatically.",
    },
    post: {
      title: "Post editor",
      desc: "A quick-post editor for updates, thoughts, and reflections arrives in the next update. Publishing your first post will promote you to Writer automatically.",
    },
    book: {
      title: "Book manuscript tool",
      desc: "The full manuscript tool with chapter management, synopsis, and cover upload arrives in the next update. Publishing your first book will promote you to Writer automatically.",
    },
  };
  const copy = labels[studioType];
  return (
    <ScreenShell title={copy.title}>
      <EmptyState
        icon={PenTool}
        title={isWriter ? copy.title : "Coming in the next update"}
        description={copy.desc}
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

// ---- Settings (with logout) ----
function SettingsScreen({ onNavigate }: ScreenProps) {
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <ScreenShell title="Settings">
      <div className="px-6 pt-6 space-y-4">
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

        <button
          onClick={() => onNavigate("profile")}
          className="ink-card flex w-full items-center justify-between p-5 transition-colors hover:bg-[var(--bg-elevated)]"
        >
          <span className="flex items-center gap-3 text-sm" style={{ color: "var(--text)" }}>
            <Feather size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
            View your profile
          </span>
          <ChevronRight size={18} style={{ color: "var(--text-faint)" }} />
        </button>
      </div>

      <div className="mt-6">
        <EmptyState
          icon={SettingsIcon}
          title="More settings coming"
          description="Account, privacy, and notification preferences will be fully editable here in a later phase."
        />
      </div>

      {/* Logout */}
      <div className="px-6 pb-12 pt-4">
        <button
          onClick={async () => {
            setSigningOut(true);
            await signOut();
          }}
          disabled={signingOut}
          className="ink-btn-ghost w-full sm:w-auto"
          style={{ color: "var(--error, #c0392b)" }}
        >
          <LogOut size={16} />
          {signingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </ScreenShell>
  );
}

// ---- Profile: real counts from the database ----
function ProfileScreen({ onNavigate, onCreate }: ScreenProps) {
  const { user, profile, isWriter, isFounder, signOut } = useAuth();
  const [postCount, setPostCount] = useState<number | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

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
  const monogram = (profile?.display_name ?? profile?.email ?? "?").charAt(0).toUpperCase();

  return (
    <ScreenShell title="Profile">
      <div className="px-6 pt-6">
        <div className="ink-card overflow-hidden">
          {/* Banner — warm gradient with subtle texture */}
          <div
            className="relative h-28 overflow-hidden"
            style={{
              background:
                "linear-gradient(120deg, color-mix(in srgb, var(--accent) 45%, var(--bg-elevated)) 0%, var(--bg-elevated) 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 20% 80%, var(--accent) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--accent) 0%, transparent 40%)",
              }}
            />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar — uploadable; amber ring; monogram placeholder or uploaded photo */}
            <div className="-mt-12 mb-4">
              <AvatarUpload currentUrl={profile?.avatar_url ?? null} monogram={monogram} size={96} />
            </div>

            <h2
              className="text-2xl"
              style={{ color: "var(--text)", fontFamily: '"Cormorant Garamond", serif' }}
            >
              {profile?.display_name ?? "Unnamed writer"}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              {profile?.email}
            </p>

            {/* Role badge pill */}
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--accent) 16%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                  boxShadow: "0 0 16px -4px color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
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

            {/* Action row — Edit / Share (Instagram-style) */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => onNavigate("settings")}
                className="ink-btn-ghost flex-1"
              >
                <Pencil size={15} />
                Edit profile
              </button>
              <button
                onClick={() => {
                  if (navigator.share && profile) {
                    navigator
                      .share({
                        title: `${profile.display_name ?? "My INKREAL profile"}`,
                        text: "Read my work on INKREAL.",
                        url: window.location.href,
                      })
                      .catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(window.location.href).catch(() => {});
                  }
                }}
                className="ink-btn-ghost flex-1"
              >
                <Share2 size={15} />
                Share profile
              </button>
            </div>

            {/* Stat row — tappable, designed with dividers + serif numerals */}
            <div
              className="mt-6 grid grid-cols-3 overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)" }}
            >
              <Stat label="Published" value={loading ? null : postCount} onClick={() => {}} />
              <Stat label="Followers" value={loading ? null : followerCount} divider onClick={() => {}} />
              <Stat label="Following" value={loading ? null : followingCount} divider onClick={() => {}} />
            </div>
          </div>
        </div>

        {/* Settings + Logout entry points */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => onNavigate("settings")}
            className="ink-card flex items-center justify-between p-4 transition-colors hover:bg-[var(--bg-elevated)]"
          >
            <span className="flex items-center gap-3 text-sm font-medium" style={{ color: "var(--text)" }}>
              <SettingsIcon size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
              Settings
            </span>
            <ChevronRight size={18} style={{ color: "var(--text-faint)" }} />
          </button>
          <button
            onClick={async () => {
              setSigningOut(true);
              await signOut();
            }}
            disabled={signingOut}
            className="ink-card flex items-center justify-between p-4 transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: "var(--error, #c0392b)" }}
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <LogOut size={18} strokeWidth={1.5} />
              {signingOut ? "Logging out..." : "Log out"}
            </span>
            <ChevronRight size={18} style={{ color: "var(--text-faint)" }} />
          </button>
        </div>
      </div>

      {/* Empty published-work state with CTA */}
      <div className="mt-8">
        <EmptyState
          icon={BookOpen}
          title={postCount === 0 ? "No published work yet" : "Your published work"}
          description={
            postCount === 0
              ? "When you publish your first piece, it will appear here — and your role will become Writer automatically."
              : "A dedicated profile feed arrives in a later phase."
          }
          action={
            postCount === 0 && (
              <button
                onClick={() => (onCreate ? onCreate() : onNavigate("studio"))}
                className="ink-btn-primary group"
              >
                Start your first piece
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            )
          }
        />
      </div>

      {/* Floating quill FAB — supplementary Create shortcut (Profile only) */}
      <button
        onClick={() => (onCreate ? onCreate() : onNavigate("studio"))}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95 lg:bottom-8 lg:right-8"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--bg)",
          boxShadow: "0 12px 32px -8px color-mix(in srgb, var(--accent) 60%, transparent)",
        }}
        aria-label="Create a new piece"
      >
        <Feather size={22} strokeWidth={1.75} />
      </button>
    </ScreenShell>
  );
}

function Stat({
  label,
  value,
  divider,
  onClick,
}: {
  label: string;
  value: number | string | null;
  divider?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex flex-col items-center py-4 text-center transition-colors enabled:hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
      style={divider ? { borderLeft: "1px solid var(--border)" } : undefined}
    >
      <div
        className="text-2xl"
        style={{ color: "var(--text)", fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 }}
      >
        {value === null ? "—" : value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
    </button>
  );
}

function ScreenShell({ title, children }: { title: string; children: ReactNode }) {
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

export function ScreenRouter({
  screen,
  onNavigate,
  studioType,
  onCreate,
}: {
  screen: ScreenId;
  onNavigate: (id: ScreenId) => void;
  studioType?: ContentType;
  onCreate?: () => void;
}) {
  switch (screen) {
    case "home":
      return <HomeScreen onNavigate={onNavigate} />;
    case "discover":
      return <DiscoverScreen />;
    case "search":
      return <SearchScreen />;
    case "library":
      return <LibraryScreen onNavigate={onNavigate} />;
    case "communities":
      return <CommunitiesScreen />;
    case "messages":
      return <MessagesScreen />;
    case "studio":
      return <StudioScreen studioType={studioType ?? "post"} />;
    case "wallet":
      return <WalletScreen />;
    case "notifications":
      return <NotificationsScreen />;
    case "settings":
      return <SettingsScreen onNavigate={onNavigate} />;
    case "profile":
      return <ProfileScreen onNavigate={onNavigate} onCreate={onCreate} />;
    default:
      return <HomeScreen onNavigate={onNavigate} />;
  }
}

export type { ScreenId };
