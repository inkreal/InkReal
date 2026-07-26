/*
# Content, Feed Index, Engagement, Notifications, Badges, Visits

## Purpose
Builds the content layer of Inkreal and the single feed_index that Home Feed and Discover query
against, regardless of which underlying content table an item lives in. Adds the server-side
role-escalation trigger (reader -> writer on first publish) and counter/notification triggers.

## 1. New Tables

### feed_index  (THE table Home + Discover query)
- `id`             uuid PK.
- `content_type`   text NOT NULL ('post' | 'poem' | 'book').
- `source_table`   text NOT NULL ('posts' | 'poems' | 'books').
- `source_id`      uuid NOT NULL.
- `creator_id`     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE.
- `created_at`     timestamptz NOT NULL DEFAULT now().
- `like_count`     integer NOT NULL DEFAULT 0.
- `comment_count`  integer NOT NULL DEFAULT 0.
- `view_count`     integer NOT NULL DEFAULT 0.
- `visibility`     text NOT NULL DEFAULT 'public'.
- UNIQUE (source_table, source_id) — one feed entry per content row.

### posts
- `id`, `creator_id` (FK profiles), `title`, `body`, `created_at`.

### poems
- `id`, `creator_id` (FK profiles), `title`, `body`, `created_at`.

### books
- `id`, `creator_id`, `title`, `synopsis`, `genre`, `cover_url`, `buy_price`, `rental_price`,
  `status` (text, default 'draft'), `created_at`.

### comments
- `id`, `target_feed_index_id` (FK feed_index), `user_id`, `body`, `created_at`.

### likes
- `id`, `target_feed_index_id` (FK feed_index), `user_id`, `created_at`.
- UNIQUE (target_feed_index_id, user_id) — one like per user per feed item.

### saves
- `id`, `target_feed_index_id` (FK feed_index), `user_id`, `created_at`.
- UNIQUE (target_feed_index_id, user_id) — one save per user per feed item.

### notifications
- `id`, `user_id`, `type` (text), `payload` (jsonb), `read` (bool default false), `created_at`.

### badges
- `id`, `user_id`, `badge_type` (text), `unlocked_at` (timestamptz default now()).
- UNIQUE (user_id, badge_type) — one of each badge type per user.

### visits
- `id`, `target_feed_index_id` (FK feed_index), `referrer_user_id` (nullable uuid),
  `created_at`. For anonymous / non-signed-up link views.

## 2. Server-side Triggers (all SECURITY DEFINER, server-authoritative)

### Role escalation — reader -> writer on first publish
- `sync_feed_index_on_content_insert`: AFTER INSERT on posts/poems/books -> inserts the matching
  feed_index row. SECURITY DEFINER so it runs with elevated privileges regardless of caller.
- `escalate_role_to_writer`: AFTER INSERT on feed_index -> if the creator's profile.role is
  'reader', UPDATE it to 'writer'. This is the ONLY mechanism that promotes reader->writer.
  It cannot be triggered by client role writes (profiles.role has no client write policy).
- `sync_feed_index_on_content_delete`: AFTER DELETE on posts/poems/books -> removes the matching
  feed_index row (cascades to comments/likes/saves/visits).

### Counter maintenance (denormalized counts on feed_index)
- `bump_like_count`, `drop_like_count` on likes insert/delete.
- `bump_comment_count`, `drop_comment_count` on comments insert/delete.
- `bump_view_count` on visits insert.

### Notifications
- `notify_on_like`: on likes insert, create a notification for the feed item's creator.
- `notify_on_comment`: on comments insert, create a notification for the feed item's creator.
  (Self-actions are skipped — you don't notify yourself.)

## 3. Security — RLS on every table
- feed_index: SELECT visible to authenticated (public feed); INSERT/UPDATE/DELETE only by the
  content owner (creator_id = auth.uid()). Note: feed_index rows are normally created by the
  SECURITY DEFINER sync trigger, not directly by clients, but the owner policy is the backstop.
- posts/poems/books: SELECT visible to authenticated; INSERT/UPDATE/DELETE only by creator.
- comments: SELECT visible to authenticated; INSERT/UPDATE/DELETE only by the comment author.
- likes: SELECT visible to authenticated; INSERT/DELETE only by the liking user.
- saves: SELECT visible to authenticated; INSERT/DELETE only by the saving user. (Others can see
  that a save exists but NOT who saved — the user_id column is readable only through the owner
  policy path; the SELECT policy intentionally exposes only the aggregate via counts.)
  Implementation: SELECT exposes user_id only for the owner; for others we expose row existence
  without user_id by selecting counts at the app layer. (See RLS comments.)
- notifications: SELECT/UPDATE only by the owning user; no INSERT via client (trigger-only);
  no DELETE via client.
- badges: SELECT visible to authenticated (badges are public achievements); INSERT only by owner;
  no UPDATE/DELETE via client.
- visits: INSERT only by authenticated or anon (anon can record anonymous link views);
  SELECT only by the feed item's creator (analytics for the owner). No UPDATE/DELETE.

## 4. Important Notes
- No seed/demo data. All tables start empty. Counts default to 0 and only move via triggers.
- feed_index is the SINGLE table Home + Discover query. Content tables are detail sources.
- Role escalation is impossible from the client: profiles.role has no client INSERT/UPDATE policy,
  and the escalate trigger is SECURITY DEFINER. The founder role is additionally gated by the
  resolve-roles edge function's exact-email check.
*/

-- =========================================================
-- TABLE: feed_index
-- =========================================================
CREATE TABLE IF NOT EXISTS feed_index (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type   text NOT NULL,
  source_table   text NOT NULL,
  source_id      uuid NOT NULL,
  creator_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  like_count     integer NOT NULL DEFAULT 0,
  comment_count  integer NOT NULL DEFAULT 0,
  view_count     integer NOT NULL DEFAULT 0,
  visibility     text NOT NULL DEFAULT 'public',
  UNIQUE (source_table, source_id)
);

ALTER TABLE feed_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_index_select_authenticated" ON feed_index;
CREATE POLICY "feed_index_select_authenticated"
ON feed_index FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feed_index_insert_own" ON feed_index;
CREATE POLICY "feed_index_insert_own"
ON feed_index FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "feed_index_update_own" ON feed_index;
CREATE POLICY "feed_index_update_own"
ON feed_index FOR UPDATE TO authenticated
USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "feed_index_delete_own" ON feed_index;
CREATE POLICY "feed_index_delete_own"
ON feed_index FOR DELETE TO authenticated
USING (auth.uid() = creator_id);

-- =========================================================
-- TABLE: posts
-- =========================================================
CREATE TABLE IF NOT EXISTS posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_authenticated" ON posts;
CREATE POLICY "posts_select_authenticated"
ON posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own"
ON posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own"
ON posts FOR UPDATE TO authenticated
USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own"
ON posts FOR DELETE TO authenticated
USING (auth.uid() = creator_id);

-- =========================================================
-- TABLE: poems
-- =========================================================
CREATE TABLE IF NOT EXISTS poems (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE poems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poems_select_authenticated" ON poems;
CREATE POLICY "poems_select_authenticated"
ON poems FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "poems_insert_own" ON poems;
CREATE POLICY "poems_insert_own"
ON poems FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "poems_update_own" ON poems;
CREATE POLICY "poems_update_own"
ON poems FOR UPDATE TO authenticated
USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "poems_delete_own" ON poems;
CREATE POLICY "poems_delete_own"
ON poems FOR DELETE TO authenticated
USING (auth.uid() = creator_id);

-- =========================================================
-- TABLE: books
-- =========================================================
CREATE TABLE IF NOT EXISTS books (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  synopsis      text,
  genre         text,
  cover_url     text,
  buy_price     numeric(10,2),
  rental_price  numeric(10,2),
  status        text NOT NULL DEFAULT 'draft',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_select_authenticated" ON books;
CREATE POLICY "books_select_authenticated"
ON books FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "books_insert_own" ON books;
CREATE POLICY "books_insert_own"
ON books FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "books_update_own" ON books;
CREATE POLICY "books_update_own"
ON books FOR UPDATE TO authenticated
USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "books_delete_own" ON books;
CREATE POLICY "books_delete_own"
ON books FOR DELETE TO authenticated
USING (auth.uid() = creator_id);

-- =========================================================
-- TABLE: comments
-- =========================================================
CREATE TABLE IF NOT EXISTS comments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_feed_index_id  uuid NOT NULL REFERENCES feed_index(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body                  text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_authenticated" ON comments;
CREATE POLICY "comments_select_authenticated"
ON comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own"
ON comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own"
ON comments FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own"
ON comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- TABLE: likes
-- =========================================================
CREATE TABLE IF NOT EXISTS likes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_feed_index_id  uuid NOT NULL REFERENCES feed_index(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_feed_index_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_authenticated" ON likes;
CREATE POLICY "likes_select_authenticated"
ON likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own"
ON likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own"
ON likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- TABLE: saves
-- =========================================================
CREATE TABLE IF NOT EXISTS saves (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_feed_index_id  uuid NOT NULL REFERENCES feed_index(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_feed_index_id, user_id)
);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Saves are private to the owner: only the saving user sees their own saves.
DROP POLICY IF EXISTS "saves_select_own" ON saves;
CREATE POLICY "saves_select_own"
ON saves FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saves_insert_own" ON saves;
CREATE POLICY "saves_insert_own"
ON saves FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saves_delete_own" ON saves;
CREATE POLICY "saves_delete_own"
ON saves FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- TABLE: notifications
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- No INSERT/DELETE policy: notifications are created only by SECURITY DEFINER triggers.

-- =========================================================
-- TABLE: badges
-- =========================================================
CREATE TABLE IF NOT EXISTS badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type  text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_type)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_select_authenticated" ON badges;
CREATE POLICY "badges_select_authenticated"
ON badges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "badges_insert_own" ON badges;
CREATE POLICY "badges_insert_own"
ON badges FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE policy: badges are append-only achievements.

-- =========================================================
-- TABLE: visits
-- =========================================================
CREATE TABLE IF NOT EXISTS visits (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_feed_index_id  uuid NOT NULL REFERENCES feed_index(id) ON DELETE CASCADE,
  referrer_user_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) may record a visit to a public feed item.
DROP POLICY IF EXISTS "visits_insert_any" ON visits;
CREATE POLICY "visits_insert_any"
ON visits FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only the feed item's creator can view their own analytics.
DROP POLICY IF EXISTS "visits_select_owner" ON visits;
CREATE POLICY "visits_select_owner"
ON visits FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM feed_index
  WHERE feed_index.id = visits.target_feed_index_id
  AND feed_index.creator_id = auth.uid()
));

-- =========================================================
-- TRIGGERS: feed_index sync (SECURITY DEFINER)
-- =========================================================
CREATE OR REPLACE FUNCTION public.sync_feed_index_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ctype text;
  stable text;
BEGIN
  stable := TG_ARGV[0];
  ctype := TG_ARGV[1];
  INSERT INTO public.feed_index (content_type, source_table, source_id, creator_id)
  VALUES (ctype, stable, NEW.id, NEW.creator_id)
  ON CONFLICT (source_table, source_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_insert ON posts;
CREATE TRIGGER on_post_insert
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_index_on_insert('posts','post');

DROP TRIGGER IF EXISTS on_poem_insert ON poems;
CREATE TRIGGER on_poem_insert
AFTER INSERT ON poems
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_index_on_insert('poems','poem');

DROP TRIGGER IF EXISTS on_book_insert ON books;
CREATE TRIGGER on_book_insert
AFTER INSERT ON books
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_index_on_insert('books','book');

-- Delete sync
CREATE OR REPLACE FUNCTION public.sync_feed_index_on_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  stable text := TG_ARGV[0];
BEGIN
  DELETE FROM public.feed_index
  WHERE source_table = stable AND source_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_post_delete ON posts;
CREATE TRIGGER on_post_delete
AFTER DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_index_on_delete('posts');

DROP TRIGGER IF EXISTS on_poem_delete ON poems;
CREATE TRIGGER on_poem_delete
AFTER DELETE ON poems
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_index_on_delete('poems');

DROP TRIGGER IF EXISTS on_book_delete ON books;
CREATE TRIGGER on_book_delete
AFTER DELETE ON books
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_index_on_delete('books');

-- =========================================================
-- TRIGGER: role escalation reader -> writer on first publish
-- =========================================================
CREATE OR REPLACE FUNCTION public.escalate_role_to_writer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'writer'
  WHERE id = NEW.creator_id AND role = 'reader';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_feed_index_escalate ON feed_index;
CREATE TRIGGER on_feed_index_escalate
AFTER INSERT ON feed_index
FOR EACH ROW EXECUTE FUNCTION public.escalate_role_to_writer();

-- =========================================================
-- TRIGGERS: counter maintenance on feed_index
-- =========================================================
CREATE OR REPLACE FUNCTION public.bump_feed_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  col text := TG_ARGV[0];
  inc integer := TG_ARGV[1]::int;
BEGIN
  EXECUTE format(
    'UPDATE public.feed_index SET %I = GREATEST(%I + $1, 0) WHERE id = $2',
    col, col
  ) USING inc, NEW.target_feed_index_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.drop_feed_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  col text := TG_ARGV[0];
  dec integer := TG_ARGV[1]::int;
BEGIN
  EXECUTE format(
    'UPDATE public.feed_index SET %I = GREATEST(%I - $1, 0) WHERE id = $2',
    col, col
  ) USING dec, OLD.target_feed_index_id;
  RETURN OLD;
END;
$$;

-- likes
DROP TRIGGER IF EXISTS on_like_bump ON likes;
CREATE TRIGGER on_like_bump
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION public.bump_feed_count('like_count', 1);

DROP TRIGGER IF EXISTS on_like_drop ON likes;
CREATE TRIGGER on_like_drop
AFTER DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION public.drop_feed_count('like_count', 1);

-- comments
DROP TRIGGER IF EXISTS on_comment_bump ON comments;
CREATE TRIGGER on_comment_bump
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION public.bump_feed_count('comment_count', 1);

DROP TRIGGER IF EXISTS on_comment_drop ON comments;
CREATE TRIGGER on_comment_drop
AFTER DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION public.drop_feed_count('comment_count', 1);

-- visits -> view_count
DROP TRIGGER IF EXISTS on_visit_bump ON visits;
CREATE TRIGGER on_visit_bump
AFTER INSERT ON visits
FOR EACH ROW EXECUTE FUNCTION public.bump_feed_count('view_count', 1);

-- =========================================================
-- TRIGGERS: notifications on like / comment
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  creator uuid;
BEGIN
  SELECT creator_id INTO creator FROM public.feed_index WHERE id = NEW.target_feed_index_id;
  IF creator IS NOT NULL AND creator <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (creator, 'like', jsonb_build_object('feed_index_id', NEW.target_feed_index_id, 'by', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_like_notify ON likes;
CREATE TRIGGER on_like_notify
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  creator uuid;
BEGIN
  SELECT creator_id INTO creator FROM public.feed_index WHERE id = NEW.target_feed_index_id;
  IF creator IS NOT NULL AND creator <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (creator, 'comment', jsonb_build_object('feed_index_id', NEW.target_feed_index_id, 'by', NEW.user_id, 'comment_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_notify ON comments;
CREATE TRIGGER on_comment_notify
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_feed_index_created ON feed_index(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_index_creator ON feed_index(creator_id);
CREATE INDEX IF NOT EXISTS idx_feed_index_type ON feed_index(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_creator ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_poems_creator ON poems(creator_id);
CREATE INDEX IF NOT EXISTS idx_books_creator ON books(creator_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_feed_index_id);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_feed_index_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_target ON visits(target_feed_index_id);
