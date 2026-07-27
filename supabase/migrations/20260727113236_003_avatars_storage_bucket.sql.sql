/*
# Avatars Storage Bucket

## Purpose
Creates a public-read storage bucket for user profile pictures (avatars),
with RLS policies allowing any authenticated user to upload to their own
folder and read everyone's avatar, and owners to delete their own.

## 1. New Storage Bucket
- `avatars` — public bucket (read access via public URL), 5 MB file size limit,
  image MIME types only (jpeg, png, webp, gif).

## 2. Storage Policies (RLS on storage.objects)
- SELECT: anyone (anon + authenticated) can read — avatars are public.
- INSERT: authenticated users can upload only to a path starting with their own
  user id (e.g. `<uid>/avatar-123.jpg`).
- UPDATE: authenticated users can update only objects in their own folder.
- DELETE: authenticated users can delete only objects in their own folder.

## 3. Important Notes
- The bucket is public so avatar URLs work in <img> tags without signed URLs.
- Write paths are scoped to the owning user's id prefix, enforced by RLS.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- SELECT: anyone can read avatars (public)
DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;
CREATE POLICY "avatars_read_all"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- INSERT: authenticated users upload to their own folder (<uid>/...)
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: owners can update their own avatar files
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: owners can delete their own avatar files
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
