-- Update the handle_new_user function to use the correct master admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role user_role;
BEGIN
  -- Check if email is the master admin
  IF NEW.email = 'matt@forzaindustries.com' THEN
    user_role := 'master_admin';
  ELSE
    -- Default to brand_admin for all other signups
    user_role := 'brand_admin';
  END IF;

  INSERT INTO public.profiles (user_id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$function$;