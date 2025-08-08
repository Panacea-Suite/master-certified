-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Update the handle_new_user function to handle the new fields
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

  INSERT INTO public.profiles (user_id, email, role, first_name, last_name, company_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'company_name',
    COALESCE(
      CONCAT(NEW.raw_user_meta_data ->> 'first_name', ' ', NEW.raw_user_meta_data ->> 'last_name'),
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$function$;