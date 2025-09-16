-- Creates a function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Create entry in public.profiles with proper name extraction
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name',
      SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1),
      SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name',
      CASE 
        WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL 
        THEN TRIM(SUBSTRING(NEW.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'full_name') + 1))
        WHEN NEW.raw_user_meta_data->>'name' IS NOT NULL 
        THEN TRIM(SUBSTRING(NEW.raw_user_meta_data->>'name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'name') + 1))
        ELSE NULL
      END
    )
  );

  -- Create corresponding entry in public.student_profiles with free tier
  INSERT INTO public.student_profiles (
    profile_id,
    status,
    subscription_tier
  )
  VALUES (
    NEW.id,
    'active'::public.account_status_enum,
    'free'::public.subscription_tier_enum
  );
  
  RETURN NEW;
END;
$function$;

-- This is the trigger that calls the function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();