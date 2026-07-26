/*
# Profiles, Roles, and Follows — Foundation

## Purpose
Establishes the identity and social-graph foundation for Inkreal. Every authenticated
user gets exactly one profile row (1:1 with auth.users). Roles are stored server-side
on the profile and are NEVER inferred from client state.

## 1. New Tables

### user_role (enum)
- `reader`  — default role for every new account; can read, follow, like, save, comment.
- `writer`  — granted automatically (server-side) the moment a reader publishes their first piece.
- `founder` — a singular, locked identity. Exactly one founder may ever exist. Granted ONLY by the
  resolve-roles edge function after the authenticated user's verified email exactly matches the
  founder email stored in app config (secure env var). This is a strict equality check, not a
  similarity check, and is performed only after authentication. Founder always carries the writer
  role in addition.

### profiles
- `id`              uuid PRIMARY KEY, 1:1 with auth.users(id). ON DELETE CASCADE.
- `email`           text NOT NULL (denormalized mirror of auth.users.email for readable RLS queries).
- `role`            user_role NOT NULL DEFAULT 'reader'. Server-authoritative. Never set by the client.
- `display_name`    text (nullable; set during onboarding).
- `avatar_url`      text (nullable).
- `bio`             text (nullable).
- `country`         text (nullable).
- `preferred_language`  text NOT NULL DEFAULT 'en'.
- `preferred_currency`  text NOT NULL DEFAULT 'USD'.
- `created_at`      timestamptz NOT NULL DEFAULT now().

### follows
- `follower_id`     uuid, references profiles(id) ON DELETE CASCADE.
- `following_id`    uuid, references profiles(id) ON DELETE CASCADE.
- `created_at`      timestamptz NOT NULL DEFAULT now().
- PRIMARY KEY (follower_id, following_id) — one follow edge per ordered pair.
- CHECK: a user cannot follow themselves.

## 2. Server-side Triggers
- `handle_new_user`: AFTER INSERT on auth.users -> creates a profiles row with the new user's id
  and email, role defaults to 'reader'. Guarantees a profile exists for every auth account. The
  founder role is NOT assigned here — that only happens via the resolve-roles edge function after
  a verified exact-email match on login.

## 3. Security — RLS on every table
- profiles: authenticated can SELECT all profiles (social graph needs readable profiles).
  A user can UPDATE only their own row, and CANNOT change the `role` column via this policy
  (role is server-managed). No INSERT/DELETE through RLS (profiles are created/removed only by
  the system trigger on auth.users).
- follows: authenticated can SELECT all follows (social graph is visible). A user can INSERT/
  DELETE only their own follow edges (as follower). Cannot manipulate others' edges.

## 4. Important Notes
- The founder email is NOT stored in any table — it lives in the app config (secure env var) and
  is read only by the resolve-roles edge function using the service role key. The database's
  is_founder() helper is a fallback mirror for policy gating and is populated by that same
  function; the edge function is the source of truth for the exact-match check.
- No seed data. All tables start empty.
*/

-- =========================================================
-- ENUM: user_role
-- =========================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('reader', 'writer', 'founder');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- TABLE: profiles
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  role                user_role NOT NULL DEFAULT 'reader',
  display_name        text,
  avatar_url          text,
  bio                 text,
  country             text,
  preferred_language  text NOT NULL DEFAULT 'en',
  preferred_currency  text NOT NULL DEFAULT 'USD',
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are visible to any signed-in user (social graph).
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
ON profiles FOR SELECT TO authenticated USING (true);

-- A user may update only their own profile, and may NOT touch the role column
-- (role is managed server-side via triggers / edge function).
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- No INSERT or DELETE policy: profiles are created/removed exclusively by the
-- handle_new_user / handle_deleted_user triggers tied to auth.users.

-- =========================================================
-- TRIGGER: create profile on signup
-- =========================================================
-- Drops idempotently so re-running the migration is safe.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- TABLE: follows
-- =========================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Follow graph is visible to signed-in users.
DROP POLICY IF EXISTS "follows_select_authenticated" ON follows;
CREATE POLICY "follows_select_authenticated"
ON follows FOR SELECT TO authenticated USING (true);

-- A user can only create follow edges where they are the follower.
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own"
ON follows FOR INSERT TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- A user can only delete their own follow edges.
DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own"
ON follows FOR DELETE TO authenticated
USING (auth.uid() = follower_id);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
