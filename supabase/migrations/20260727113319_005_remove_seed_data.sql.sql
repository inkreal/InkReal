/*
# REMOVE Dev Seed Data — run before launch

## Purpose
Purges all temporary seed data tagged with is_seed_data = true. This is the
clean, single-action removal method for the seed data inserted by migration
004_dev_seed_data.sql.

## What gets deleted
- All posts where is_seed_data = true
- All poems where is_seed_data = true
- All books where is_seed_data = true
- All feed_index rows belonging to seed profiles (auto-created by triggers,
  they don't have an is_seed_data flag, so we scope by creator_id)
- All profiles where is_seed_data = true
- The matching auth.users rows (by the fixed seed UUIDs)

## Important Notes
- This only removes seeded rows. Real user data is untouched.
- After running, the is_seed_data columns can be dropped in a follow-up
  migration if desired (they default to false and are harmless to keep).
- Safe to re-run: deleting zero rows is a no-op.
*/

-- Remove seed content (feed_index rows cascade from content table deletes
-- via the sync_feed_index_on_delete triggers, but we also clean any orphans).
DELETE FROM posts WHERE is_seed_data = true;
DELETE FROM poems WHERE is_seed_data = true;
DELETE FROM books WHERE is_seed_data = true;

-- Clean any orphaned feed_index rows from seed profiles
DELETE FROM feed_index
WHERE creator_id IN (SELECT id FROM profiles WHERE is_seed_data = true);

-- Remove seed profiles
DELETE FROM profiles WHERE is_seed_data = true;

-- Remove the seed auth.users rows (fixed UUIDs from 004_dev_seed_data.sql)
DELETE FROM auth.users
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);
