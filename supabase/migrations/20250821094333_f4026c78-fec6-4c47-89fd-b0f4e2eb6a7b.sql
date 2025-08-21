-- Fix ambiguous user_id reference in admin_get_all_brands function
CREATE OR REPLACE FUNCTION public.admin_get_all_brands()
 RETURNS TABLE(id uuid, name text, user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, user_email text, user_display_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is master_admin
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Access denied: only master admins can view all brands';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.user_id,
    b.created_at,
    b.updated_at,
    p.email,
    p.display_name
  FROM public.brands b
  JOIN public.profiles p ON p.user_id = b.user_id
  ORDER BY b.created_at DESC;
END;
$function$