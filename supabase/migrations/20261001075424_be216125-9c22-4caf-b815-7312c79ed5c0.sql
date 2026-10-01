DROP POLICY IF EXISTS "photos read" ON storage.objects;
CREATE POLICY "photos read" ON storage.objects FOR SELECT USING (
  bucket_id = 'photos' AND (
    -- own folder (sender always keeps access to their own letter files)
    (storage.foldername(name))[1] = ('u-' || auth.uid()::text)
    OR (
      (storage.foldername(name))[1] = my_couple_id()::text
      AND coalesce((storage.foldername(name))[2], '') <> 'capsules'
      AND (owner = auth.uid() OR (storage.foldername(name))[2] = 'avatars'
        OR EXISTS (SELECT 1 FROM public.photo_posts p WHERE p.storage_path = objects.name AND has_posted(p.post_date)))
    )
  )
);

CREATE OR REPLACE FUNCTION public.capsule_file_readable(_name text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  select exists (select 1 from public.capsules c
    where (c.photo_path = _name or c.voice_path = _name)
      and _name like ('u-' || c.sender_id::text || '/capsules/' || c.id::text || '/%')
      and public.capsule_readable(c.id))
$$;