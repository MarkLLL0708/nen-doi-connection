REVOKE EXECUTE ON FUNCTION public.my_space_kind() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_space_kind() TO authenticated;