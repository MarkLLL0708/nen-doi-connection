-- Nến Đôi live Supabase read-only security audit
-- Run in Supabase Dashboard > SQL Editor against the PRODUCTION project.
-- This file contains SELECT statements only. Review the results; do not assume every
-- function exposed to authenticated is unsafe. Validate each result against intended behavior.

-- 1) Public tables without RLS enabled. Investigate every returned row.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relkind AS relation_kind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND NOT c.relrowsecurity
ORDER BY c.relname;

-- 2) Current RLS policies for application tables and Supabase Storage objects.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

-- 3) SECURITY DEFINER functions executable by anon or authenticated.
-- Review each returned function's body and verify it derives identity from auth.uid(),
-- validates couple membership and constrains object IDs to the caller's own couple.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_userbyid(p.proowner) AS owner_name,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  EXISTS (
    SELECT 1
    FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) acl
    WHERE acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) AS public_role_has_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);

-- 4) Storage bucket visibility. Private user/couple photos should not be in a public bucket.
SELECT id AS bucket_id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- 5) Test-account flag support. If the column exists, inspect the count before cleanup.
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_test_account';

-- Run the next query only if the previous result confirms public.profiles.is_test_account exists:
-- SELECT count(*) AS flagged_test_profiles
-- FROM public.profiles
-- WHERE is_test_account IS TRUE;

-- 6) Invite hygiene counts (counts only; no invite codes or user IDs are exposed).
SELECT
  count(*) FILTER (WHERE used_by IS NULL AND expires_at > now()) AS unused_unexpired_invites,
  count(*) FILTER (WHERE used_by IS NULL AND expires_at <= now()) AS unused_expired_invites,
  count(*) FILTER (WHERE used_by IS NOT NULL) AS used_invites
FROM public.invites;
