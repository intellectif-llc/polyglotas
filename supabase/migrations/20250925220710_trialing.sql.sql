set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_trial_eligibility(user_profile_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- User is NOT eligible if they have ever had any subscription (including trials)
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.student_subscriptions 
    WHERE profile_id = user_profile_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.convert_trial_to_paid(stripe_subscription_id text, new_status subscription_status_enum)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Get the profile_id for this subscription
  SELECT profile_id INTO v_profile_id
  FROM public.student_subscriptions
  WHERE stripe_subscription_id = convert_trial_to_paid.stripe_subscription_id
    AND status = 'trialing';

  IF v_profile_id IS NULL THEN
    RETURN false;
  END IF;

  -- Update subscription status
  UPDATE public.student_subscriptions
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE stripe_subscription_id = convert_trial_to_paid.stripe_subscription_id;

  -- Update user's subscription tier
  PERFORM public.update_user_subscription_tier(v_profile_id);

  -- Log conversion
  INSERT INTO public.user_points_log (
    profile_id,
    points_awarded,
    reason_code,
    notes
  ) VALUES (
    v_profile_id,
    0,
    'TRIAL_CONVERTED',
    'Trial converted to paid subscription: ' || convert_trial_to_paid.stripe_subscription_id
  );

  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_standard_trial(user_profile_id uuid, stripe_subscription_id text, stripe_price_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_price_record RECORD;
  v_trial_start timestamp with time zone;
  v_trial_end timestamp with time zone;
  v_subscription_data jsonb;
BEGIN
  -- Check trial eligibility
  IF NOT public.check_trial_eligibility(user_profile_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_eligible',
      'message', 'User has already used their trial or has an existing subscription'
    );
  END IF;

  -- Get price information (no trial_period_days check needed - handled by Stripe checkout)
  SELECT p.id, prod.tier_key
  INTO v_price_record
  FROM public.prices p
  JOIN public.products prod ON p.product_id = prod.id
  WHERE p.stripe_price_id = stripe_price_id
    AND p.active = true
    AND prod.tier_key = 'pro';

  IF v_price_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_price',
      'message', 'Price not found or not a Pro tier price'
    );
  END IF;

  -- Calculate trial dates (7 days)
  v_trial_start := NOW();
  v_trial_end := v_trial_start + INTERVAL '7 days';

  -- Create subscription record
  INSERT INTO public.student_subscriptions (
    profile_id,
    price_id,
    stripe_subscription_id,
    status,
    current_period_start,
    current_period_end,
    trial_start_at,
    trial_end_at,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    user_profile_id,
    v_price_record.id,
    stripe_subscription_id,
    'trialing',
    v_trial_start,
    v_trial_end,
    v_trial_start,
    v_trial_end,
    jsonb_build_object(
      'trial_type', 'standard_trial',
      'created_via', 'try_pro_button'
    ),
    NOW(),
    NOW()
  );

  -- Update user's subscription tier
  PERFORM public.update_user_subscription_tier(user_profile_id);

  -- Log trial creation
  INSERT INTO public.user_points_log (
    profile_id,
    points_awarded,
    reason_code,
    notes
  ) VALUES (
    user_profile_id,
    0,
    'TRIAL_STARTED',
    'Standard 7-day Pro trial started via Stripe: ' || stripe_subscription_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'trial_start', v_trial_start,
    'trial_end', v_trial_end,
    'subscription_id', stripe_subscription_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_standard_trials()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  expired_profile_id uuid;
BEGIN
  -- Loop through expired standard trials only
  FOR expired_profile_id IN 
    SELECT DISTINCT profile_id 
    FROM public.student_subscriptions 
    WHERE status = 'trialing'
      AND trial_end_at <= NOW()
      AND (metadata->>'trial_type' = 'standard_trial' OR stripe_subscription_id NOT LIKE 'trial_%')
  LOOP
    -- Update the subscription status
    UPDATE public.student_subscriptions 
    SET 
      status = 'canceled',
      ended_at = NOW(),
      updated_at = NOW()
    WHERE profile_id = expired_profile_id
      AND status = 'trialing'
      AND (metadata->>'trial_type' = 'standard_trial' OR stripe_subscription_id NOT LIKE 'trial_%');
    
    -- Update user's subscription tier
    PERFORM public.update_user_subscription_tier(expired_profile_id);

    -- Log trial expiration
    INSERT INTO public.user_points_log (
      profile_id,
      points_awarded,
      reason_code,
      notes
    ) VALUES (
      expired_profile_id,
      0,
      'TRIAL_EXPIRED',
      'Standard 7-day Pro trial expired'
    );
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_trial_eligibility_details(user_profile_id uuid)
 RETURNS TABLE(is_eligible boolean, reason_code text, reason_message text, has_previous_subscription boolean, previous_subscription_count integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_subscription_count integer;
  v_has_subscription boolean;
BEGIN
  -- Count all previous subscriptions
  SELECT COUNT(*) INTO v_subscription_count
  FROM public.student_subscriptions
  WHERE profile_id = user_profile_id;

  v_has_subscription := v_subscription_count > 0;

  RETURN QUERY SELECT
    NOT v_has_subscription as is_eligible,
    CASE 
      WHEN NOT v_has_subscription THEN 'eligible'
      ELSE 'has_previous_subscription'
    END as reason_code,
    CASE 
      WHEN NOT v_has_subscription THEN 'User is eligible for 7-day Pro trial'
      ELSE 'User has already used their trial or has an existing subscription'
    END as reason_message,
    v_has_subscription,
    v_subscription_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_trial_status(user_profile_id uuid)
 RETURNS TABLE(has_trial boolean, trial_type text, trial_start timestamp with time zone, trial_end timestamp with time zone, days_remaining integer, is_expired boolean, subscription_id text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 FROM public.student_subscriptions 
      WHERE profile_id = user_profile_id 
        AND status = 'trialing'
    ) as has_trial,
    COALESCE(
      (ss.metadata->>'trial_type')::text,
      'unknown'
    ) as trial_type,
    ss.trial_start_at,
    ss.trial_end_at,
    GREATEST(0, EXTRACT(days FROM (ss.trial_end_at - NOW()))::integer) as days_remaining,
    (ss.trial_end_at <= NOW()) as is_expired,
    ss.stripe_subscription_id
  FROM public.student_subscriptions ss
  WHERE ss.profile_id = user_profile_id
    AND ss.status = 'trialing'
  ORDER BY ss.created_at DESC
  LIMIT 1;
END;
$function$
;


