/*
# Dev Seed Data — TEMPORARY, removable

## Purpose
Adds a small amount of sample content (profiles, posts, poems, books) so the
app screens feel populated during development and testing. This is explicitly
TEMPORARY and must be purged before launch.

## 1. Schema Changes
- Adds `is_seed_data boolean NOT NULL DEFAULT false` to: posts, poems, books,
  profiles. This flag tags every seeded row so it can be removed with a single
  targeted DELETE without affecting real user data.

## 2. Seed Content
- 3 sample creator profiles (with matching auth.users rows to satisfy the FK).
- 3 posts, 3 poems, 2 books = 8 content items total.
- feed_index rows are auto-created by the existing SECURITY DEFINER sync triggers.
- No likes, comments, follows, or notifications are seeded — only content.

## 3. REMOVAL METHOD
To fully purge all seed data before launch, run:

  DELETE FROM posts WHERE is_seed_data = true;
  DELETE FROM poems WHERE is_seed_data = true;
  DELETE FROM books WHERE is_seed_data = true;
  DELETE FROM feed_index WHERE creator_id IN (SELECT id FROM profiles WHERE is_seed_data = true);
  DELETE FROM profiles WHERE is_seed_data = true;
  DELETE FROM auth.users WHERE id IN ('<the three seed uuids>');

Or simply re-run the companion `004_remove_seed_data.sql` migration which
performs the full purge. The is_seed_data columns can be dropped afterward
with a separate migration if desired.

## 4. Important Notes
- Seed auth.users entries use random UUIDs and dummy emails — they cannot log
  in (no valid password hash) and exist only to satisfy the profiles FK.
- All seeded rows have is_seed_data = true so they are trivially identifiable.
- This is a deliberate, one-time exception to the no-fake-data rule for dev.
*/

-- =========================================================
-- Add is_seed_data flag to content + profile tables
-- =========================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE poems ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;

-- =========================================================
-- Create seed auth.users rows (so profiles FK is satisfied)
-- These use dummy emails and cannot be logged into.
-- =========================================================
-- Fixed UUIDs for clean removal.
DO $$
DECLARE
  s1 uuid := 'a1111111-1111-1111-1111-111111111111';
  s2 uuid := 'a2222222-2222-2222-2222-222222222222';
  s3 uuid := 'a3333333-3333-3333-3333-333333333333';
BEGIN
  -- Insert into auth.users (bypasses RLS as service role during migration)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (s1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seed-elena@inkreal.dev', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"seed":true}'),
    (s2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seed-marcus@inkreal.dev', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"seed":true}'),
    (s3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seed-yuki@inkreal.dev', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"seed":true}')
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles (the handle_new_user trigger would normally do this, but
  -- we insert directly with is_seed_data = true and display names)
  INSERT INTO profiles (id, email, role, display_name, bio, is_seed_data)
  VALUES
    (s1, 'seed-elena@inkreal.dev', 'writer', 'Elena Marsh', 'Essayist and poet writing about memory, place, and the slow art of paying attention.', true),
    (s2, 'seed-marcus@inkreal.dev', 'writer', 'Marcus Vale', 'Short fiction and urban lore. Believes every street has a story waiting to be heard.', true),
    (s3, 'seed-yuki@inkreal.dev', 'writer', 'Yuki Tanaka', 'Poet and translator. Finding the space between two languages where meaning lives.', true)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    is_seed_data = true;
END $$;

-- =========================================================
-- Seed content (posts, poems, books)
-- feed_index rows auto-created by SECURITY DEFINER triggers.
-- =========================================================
DO $$
DECLARE
  s1 uuid := 'a1111111-1111-1111-1111-111111111111';
  s2 uuid := 'a2222222-2222-2222-2222-222222222222';
  s3 uuid := 'a3333333-3333-3333-3333-333333333333';
BEGIN
  -- POSTS (maps to "Story" and "Post" in the Create menu)
  INSERT INTO posts (creator_id, title, body, is_seed_data) VALUES
    (s1, 'The Weight of a Closed Door',
     'There is a particular silence that follows the closing of a door — not the absence of sound, but the presence of everything that just left. I have been thinking about the doors I have closed in my life, and the ones closed behind me, and how neither kind is ever really about the door.',
     true),
    (s2, 'Last Train to Halsted Street',
     'The 11:47 to Halsted was never on time, but we took it anyway. There is a freedom in boarding a train you know will be late — you have already surrendered to the schedule of the city, and in that surrender there is nothing left to wait for. Marcus sat two rows ahead, reading a paperback with the spine cracked so far back the pages curled inward like a hand closing.',
     true),
    (s1, 'On Keeping a Notebook',
     'A notebook is not a record. It is a permission slip — to notice, to be partial, to write down the half-thought and trust that it will mean something later. The notebook does not care if you finish the thought. It only asks that you started.',
     true);

  -- POEMS
  INSERT INTO poems (creator_id, title, body, is_seed_data) VALUES
    (s3, 'Between Languages',
     'In Japanese the word for rain\nis the same sound as waiting —\n\name, ame —\nand I have never known\nwhich one is falling\nwhen I look out the window\nat a city I learned to read\nin two alphabets,\nneither of them\nmy first.',
     true),
    (s3, 'Translation',
     'What is lost is not the meaning\nbut the weather of the meaning —\nthe humidity of a word\nthat only makes sense\nin the season it was said.\n\nI carry an umbrella\nin both languages\nand am never quite dry\nin either.',
     true),
    (s1, 'House With No Hallway',
     'You enter straight into the living room\nwhere my mother kept the good chairs\nunder a sheet of clear plastic —\na room you could look at\nbut not sit in.\n\nI have built my whole life\nas a hallway leading back to that room,\ntrying to arrive\nwith wet shoes,\nwith dirty hands,\nwith the right to ruin something beautiful.',
     true);

  -- BOOKS
  INSERT INTO books (creator_id, title, synopsis, genre, status, is_seed_data) VALUES
    (s2, 'The Halsted Chronicles', 'A collection of interlinked stories set on a single city block over forty years. Each story follows a different resident of Halsted Street as the neighborhood changes around them.', 'Literary Fiction', 'published', true),
    (s1, 'Slow Water: Essays on Attention', 'Twelve essays exploring what it means to slow down in a world that rewards speed. From the geometry of a tide pool to the grammar of a handwritten letter, each piece traces the architecture of paying attention.', 'Essays', 'published', true);
END $$;
