

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";








ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."account_status_enum" AS ENUM (
    'pending_verification',
    'active',
    'suspended',
    'deactivated'
);


ALTER TYPE "public"."account_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."activity_status_enum" AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."activity_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."activity_type_enum" AS ENUM (
    'dictation',
    'pronunciation',
    'chat'
);


ALTER TYPE "public"."activity_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."contact_reason_enum" AS ENUM (
    'billing_issue',
    'partnership_benefits',
    'technical_issue',
    'feature_request',
    'content_error',
    'account_question',
    'other'
);


ALTER TYPE "public"."contact_reason_enum" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status_enum" AS ENUM (
    'draft',
    'open',
    'paid',
    'void',
    'uncollectible',
    'past_due',
    'refunded',
    'pending'
);


ALTER TYPE "public"."invoice_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."level_enum" AS ENUM (
    'A1',
    'A2',
    'B1',
    'B2',
    'C1',
    'C2'
);


ALTER TYPE "public"."level_enum" OWNER TO "postgres";


CREATE TYPE "public"."partnership_invitation_status" AS ENUM (
    'pending',
    'redeemed',
    'expired'
);


ALTER TYPE "public"."partnership_invitation_status" OWNER TO "postgres";


CREATE TYPE "public"."price_billing_interval_enum" AS ENUM (
    'day',
    'week',
    'month',
    'year'
);


ALTER TYPE "public"."price_billing_interval_enum" OWNER TO "postgres";


CREATE TYPE "public"."price_type_enum" AS ENUM (
    'recurring',
    'one_time'
);


ALTER TYPE "public"."price_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."purchase_type_enum" AS ENUM (
    'points',
    'money'
);


ALTER TYPE "public"."purchase_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."sender_type_enum" AS ENUM (
    'user',
    'ai'
);


ALTER TYPE "public"."sender_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status_enum" AS ENUM (
    'trialing',
    'active',
    'past_due',
    'unpaid',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'paused'
);


ALTER TYPE "public"."subscription_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."subscription_tier_enum" AS ENUM (
    'free',
    'starter',
    'pro'
);


ALTER TYPE "public"."subscription_tier_enum" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status_enum" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."ticket_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."tour_progress_status" AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."tour_progress_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role_enum" AS ENUM (
    'student',
    'partnership_manager',
    'admin',
    'support'
);


ALTER TYPE "public"."user_role_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_fix_user_tier"("user_profile_id" "uuid") RETURNS TABLE("old_tier" "text", "new_tier" "text", "active_subscriptions" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  old_tier_val TEXT;
  new_tier_val TEXT;
  active_subs TEXT[];
BEGIN
  -- Get current tier
  SELECT sp.subscription_tier::TEXT INTO old_tier_val
  FROM public.student_profiles sp
  WHERE sp.profile_id = user_profile_id;

  -- Get active subscriptions
  SELECT ARRAY_AGG(prod.tier_key || ' (' || ss.stripe_subscription_id || ')')
  INTO active_subs
  FROM public.student_subscriptions ss
  JOIN public.prices pr ON ss.price_id = pr.id
  JOIN public.products prod ON pr.product_id = prod.id
  WHERE ss.profile_id = user_profile_id
  AND ss.status IN ('active', 'trialing')
  AND (ss.ended_at IS NULL OR ss.ended_at > NOW());

  -- Update tier
  new_tier_val := public.update_user_subscription_tier(user_profile_id);

  RETURN QUERY SELECT old_tier_val, new_tier_val, COALESCE(active_subs, ARRAY[]::TEXT[]);
END;
$$;


ALTER FUNCTION "public"."admin_fix_user_tier"("user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_book_completion"("p_profile_id" "uuid", "p_book_id" integer) RETURNS TABLE("total_chapters" integer, "completed_chapters" integer, "completion_percentage" numeric, "is_book_completed" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_total_chapters INTEGER;
    v_completed_chapters INTEGER;
    v_completion_percentage NUMERIC;
    v_is_book_completed BOOLEAN;
BEGIN
    -- Get total chapters for the book
    SELECT COUNT(*) INTO v_total_chapters
    FROM public.audiobook_chapters
    WHERE book_id = p_book_id;
    
    -- Get completed chapters for the user
    SELECT COUNT(*) INTO v_completed_chapters
    FROM public.user_audiobook_chapter_progress
    WHERE profile_id = p_profile_id 
    AND book_id = p_book_id 
    AND is_completed = true;
    
    -- Calculate completion percentage (capped at 100%)
    v_completion_percentage := CASE 
        WHEN v_total_chapters > 0 THEN 
            LEAST(100, (v_completed_chapters::NUMERIC / v_total_chapters::NUMERIC) * 100)
        ELSE 0
    END;
    
    -- Determine if book is completed (all chapters completed)
    v_is_book_completed := v_completed_chapters = v_total_chapters AND v_total_chapters > 0;
    
    RETURN QUERY SELECT 
        v_total_chapters,
        v_completed_chapters,
        v_completion_percentage,
        v_is_book_completed;
END;
$$;


ALTER FUNCTION "public"."calculate_book_completion"("p_profile_id" "uuid", "p_book_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_access_lesson"("profile_id_param" "uuid", "lesson_id_param" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$DECLARE
    lesson_unit_id integer;
    lesson_order_val integer;
    previous_lesson_id integer;
BEGIN
    -- Get the unit and order of the requested lesson
    SELECT l.unit_id, l.lesson_order INTO lesson_unit_id, lesson_order_val 
    FROM public.lessons l WHERE l.lesson_id = lesson_id_param;

    -- Robustness: If the lesson doesn't exist, access is denied.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if user can access the parent unit
    IF NOT public.can_user_access_unit(profile_id_param, lesson_unit_id) THEN
        RETURN FALSE;
    END IF;

    -- FIXED: If this is the first lesson in the unit (lesson_order = 1), always allow access
    IF lesson_order_val = 1 THEN
        RETURN TRUE;
    END IF;

    -- Find the previous lesson in the same unit (by lesson_order)
    SELECT l.lesson_id INTO previous_lesson_id
    FROM public.lessons l
    WHERE l.unit_id = lesson_unit_id
      AND l.lesson_order = lesson_order_val - 1;

    -- If no previous lesson found, something is wrong with data, but allow access
    IF previous_lesson_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if previous lesson is completed using the helper function
    RETURN public.is_lesson_complete(profile_id_param, previous_lesson_id);
END;$$;


ALTER FUNCTION "public"."can_user_access_lesson"("profile_id_param" "uuid", "lesson_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_access_level"("profile_id_param" "uuid", "level_code_param" "public"."level_enum") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN level_code_param = ANY(public.get_user_available_levels(profile_id_param));
END;
$$;


ALTER FUNCTION "public"."can_user_access_level"("profile_id_param" "uuid", "level_code_param" "public"."level_enum") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_access_unit"("profile_id_param" "uuid", "unit_id_param" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$DECLARE
    unit_level level_enum;
    unit_order_val integer;
    previous_unit_id integer;
BEGIN
    -- Get the level and order of the requested unit
    SELECT u.level, u.unit_order INTO unit_level, unit_order_val 
    FROM public.units u WHERE u.unit_id = unit_id_param;

    -- Robustness: If the unit doesn't exist, access is denied.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if user can access this level
    IF NOT public.can_user_access_level(profile_id_param, unit_level) THEN
        RETURN FALSE;
    END IF;

    -- FIXED: If this is the first unit in the level (unit_order = 1), always allow access
    IF unit_order_val = 1 THEN
        RETURN TRUE;
    END IF;

    -- Find the previous unit in the same level (by unit_order)
    SELECT u.unit_id INTO previous_unit_id
    FROM public.units u
    WHERE u.level = unit_level
      AND u.unit_order = unit_order_val - 1;

    -- If no previous unit found, something is wrong with data, but allow access
    IF previous_unit_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if the previous unit is completed
    RETURN public.is_unit_complete(profile_id_param, previous_unit_id);
END;$$;


ALTER FUNCTION "public"."can_user_access_unit"("profile_id_param" "uuid", "unit_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_unit_completion_bonus"("profile_id_param" "uuid", "unit_id_param" integer, "triggering_lesson_id_param" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- ### FIX: Changed variable type from TEXT to level_enum ###
    v_level_code public.level_enum;
    is_unit_now_completed BOOLEAN;
    is_level_now_completed BOOLEAN;
BEGIN
    -- Check if a UNIT_COMPLETION bonus was already given for any lesson within this unit.
    IF EXISTS (
        SELECT 1 FROM public.user_points_log
        WHERE profile_id = profile_id_param
        AND reason_code = 'UNIT_COMPLETION'
        AND related_lesson_id IN (SELECT lesson_id FROM public.lessons WHERE unit_id = unit_id_param)
    ) THEN
        RETURN;
    END IF;

    is_unit_now_completed := public.is_unit_complete(profile_id_param, unit_id_param);

    IF is_unit_now_completed THEN
        -- Award unit completion points, logging the lesson ID that triggered it.
        INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id)
        VALUES (profile_id_param, 25, 'UNIT_COMPLETION', triggering_lesson_id_param);

        UPDATE public.student_profiles SET points = points + 25 WHERE profile_id = profile_id_param;

        -- Now, check for level completion.
        SELECT u.level INTO v_level_code FROM public.units u WHERE u.unit_id = unit_id_param;

        -- Check if a LEVEL_COMPLETION bonus was already given for any lesson within this level.
        IF NOT EXISTS (
            SELECT 1 FROM public.user_points_log
            WHERE profile_id = profile_id_param
              AND reason_code = 'LEVEL_COMPLETION'
              AND related_lesson_id IN (
                  SELECT l.lesson_id FROM public.lessons l
                  JOIN public.units u ON l.unit_id = u.unit_id
                  WHERE u.level = v_level_code -- This comparison is now valid (level_enum = level_enum)
              )
        ) THEN
            is_level_now_completed := NOT EXISTS (
                SELECT 1 FROM public.units u
                WHERE u.level = v_level_code -- This comparison is now valid (level_enum = level_enum)
                AND NOT public.is_unit_complete(profile_id_param, u.unit_id)
            );

            IF is_level_now_completed THEN
                -- Award level completion points, logging the lesson ID that triggered it.
                INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id)
                VALUES (profile_id_param, 100, 'LEVEL_COMPLETION', triggering_lesson_id_param);

                UPDATE public.student_profiles SET points = points + 100 WHERE profile_id = profile_id_param;
            END IF;
        END IF;
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_and_award_unit_completion_bonus"("profile_id_param" "uuid", "unit_id_param" integer, "triggering_lesson_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_audiobook_ownership"("p_profile_id" "uuid", "p_book_id" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_audiobook_purchases
    WHERE profile_id = p_profile_id AND book_id = p_book_id
  );
END;
$$;


ALTER FUNCTION "public"."check_audiobook_ownership"("p_profile_id" "uuid", "p_book_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_user_subscriptions"("user_profile_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_tier TEXT;
BEGIN
  -- Mark expired subscriptions as ended if they're not already
  UPDATE public.student_subscriptions
  SET
    status = 'canceled',
    ended_at = COALESCE(ended_at, NOW()),
    updated_at = NOW()
  WHERE profile_id = user_profile_id
  AND status IN ('active', 'trialing')
  AND current_period_end < NOW();

  -- Update user's subscription tier based on remaining active subscriptions
  new_tier := public.update_user_subscription_tier(user_profile_id);

  RETURN new_tier;
END;
$$;


ALTER FUNCTION "public"."cleanup_user_subscriptions"("user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_partnership_trials"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  expired_profile_id uuid;
BEGIN
  -- Loop through expired trials and update each user's tier
  FOR expired_profile_id IN 
    SELECT DISTINCT profile_id 
    FROM student_subscriptions 
    WHERE status = 'trialing'
      AND trial_end_at <= NOW()
      AND stripe_subscription_id LIKE 'trial_%'
  LOOP
    -- Update the subscription status first
    UPDATE student_subscriptions 
    SET 
      status = 'canceled',
      ended_at = NOW(),
      updated_at = NOW()
    WHERE profile_id = expired_profile_id
      AND status = 'trialing'
      AND stripe_subscription_id LIKE 'trial_%';
    
    -- Then update the user's subscription tier using existing function
    PERFORM update_user_subscription_tier(expired_profile_id);
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."expire_partnership_trials"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_audiobook_purchases"("p_profile_id" "uuid") RETURNS TABLE("book_id" integer, "title" character varying, "author" character varying, "cover_image_url" character varying, "purchase_type" "public"."purchase_type_enum", "amount_paid_cents" integer, "points_spent" integer, "purchased_at" timestamp with time zone, "invoice_pdf_url" "text", "hosted_invoice_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.book_id,
    a.title,
    a.author,
    a.cover_image_url,
    p.purchase_type,
    p.amount_paid_cents,
    p.points_spent,
    p.purchased_at,
    i.invoice_pdf_url,
    i.hosted_invoice_url
  FROM user_audiobook_purchases p
  JOIN audiobooks a ON p.book_id = a.book_id
  LEFT JOIN invoices i ON i.profile_id = p.profile_id 
    AND (i.metadata->>'book_id')::INTEGER = p.book_id
  WHERE p.profile_id = p_profile_id
  ORDER BY p.purchased_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_audiobook_purchases"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_available_levels"("profile_id_param" "uuid") RETURNS "public"."level_enum"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
completed_levels level_enum[];
available_levels level_enum[];
next_level level_enum;
max_completed_order integer := 0;
BEGIN
SELECT ARRAY_AGG(ulc.level_code ORDER BY ll.sort_order)
INTO completed_levels
FROM public.user_level_completion ulc
JOIN public.language_levels ll ON ulc.level_code = ll.level_code
WHERE ulc.profile_id = profile_id_param;

    -- Start with A1 (always available)
    available_levels := ARRAY['A1'::level_enum];

    -- Add completed levels
    IF completed_levels IS NOT NULL THEN
        available_levels := available_levels || completed_levels;

        -- Find highest completed level order using language_levels table
        SELECT MAX(ll.sort_order)
        INTO max_completed_order
        FROM unnest(completed_levels) AS level_code
        JOIN public.language_levels ll ON ll.level_code = level_code::level_enum;
    END IF;

    -- Add next level if exists
    SELECT level_code INTO next_level
    FROM public.language_levels
    WHERE sort_order = max_completed_order + 1;

    IF next_level IS NOT NULL AND NOT (next_level = ANY(available_levels)) THEN
        available_levels := available_levels || ARRAY[next_level];
    END IF;

    -- FIXED: Remove duplicates without ORDER BY in ARRAY_AGG DISTINCT
    WITH ordered_levels AS (
        SELECT DISTINCT level::level_enum as level_code, ll.sort_order
        FROM unnest(available_levels) AS level
        JOIN public.language_levels ll ON ll.level_code = level::level_enum
        ORDER BY ll.sort_order
    )
    SELECT ARRAY_AGG(level_code)
    INTO available_levels
    FROM ordered_levels;

    RETURN COALESCE(available_levels, ARRAY['A1'::level_enum]);

END;
$$;


ALTER FUNCTION "public"."get_user_available_levels"("profile_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_billing_summary"("user_profile_id" "uuid") RETURNS TABLE("current_tier" "text", "active_subscriptions_count" integer, "next_billing_date" timestamp with time zone, "monthly_amount" integer, "has_payment_method" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.subscription_tier::TEXT as current_tier,
    (
      SELECT COUNT(*)::INTEGER
      FROM public.student_subscriptions ss
      WHERE ss.profile_id = user_profile_id
      AND ss.status IN ('active', 'trialing')
      AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
    ) as active_subscriptions_count,
    (
      SELECT MIN(ss.current_period_end)
      FROM public.student_subscriptions ss
      WHERE ss.profile_id = user_profile_id
      AND ss.status IN ('active', 'trialing')
      AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
    ) as next_billing_date,
    (
      SELECT SUM(pr.unit_amount)::INTEGER
      FROM public.student_subscriptions ss
      JOIN public.prices pr ON ss.price_id = pr.id
      WHERE ss.profile_id = user_profile_id
      AND ss.status IN ('active', 'trialing')
      AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
      AND pr.billing_interval = 'month'
    ) as monthly_amount,
    (sp.default_payment_method_details IS NOT NULL) as has_payment_method
  FROM public.student_profiles sp
  WHERE sp.profile_id = user_profile_id;
END;
$$;


ALTER FUNCTION "public"."get_user_billing_summary"("user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_highest_tier"("user_profile_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  highest_tier TEXT := 'free';
  tier_record RECORD;
BEGIN
  -- Check for active subscriptions and find the highest tier
  FOR tier_record IN
    SELECT p.tier_key
    FROM public.student_subscriptions ss
    JOIN public.prices pr ON ss.price_id = pr.id
    JOIN public.products p ON pr.product_id = p.id
    WHERE ss.profile_id = user_profile_id
    AND ss.status IN ('active', 'trialing')
    AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
    ORDER BY
      CASE p.tier_key
        WHEN 'pro' THEN 3
        WHEN 'starter' THEN 2
        WHEN 'free' THEN 1
        ELSE 0
      END DESC
    LIMIT 1
  LOOP
    highest_tier := tier_record.tier_key;
    EXIT;
  END LOOP;

  RETURN highest_tier;
END;
$$;


ALTER FUNCTION "public"."get_user_highest_tier"("user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_progression_status"("profile_id_param" "uuid") RETURNS TABLE("level_code" "public"."level_enum", "level_available" boolean, "unit_id" integer, "unit_available" boolean, "lesson_id" integer, "lesson_available" boolean, "lesson_completed" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH lesson_completion AS (
        -- Step 1: Determine the completion status for every lesson for the user.
        SELECT
            l.lesson_id,
            COALESCE(lc.is_completed, FALSE) AS is_completed
        FROM public.lessons l
        LEFT JOIN (
            SELECT
                ulp.lesson_id,
                (COUNT(CASE WHEN ulap.status = 'completed' THEN 1 END) =
                    (CASE WHEN l_inner.has_chat THEN 1 ELSE 0 END +
                     CASE WHEN l_inner.has_pronunciation THEN 1 ELSE 0 END +
                     CASE WHEN l_inner.has_dictation THEN 1 ELSE 0 END)
                ) AS is_completed
            FROM public.user_lesson_progress ulp
            JOIN public.user_lesson_activity_progress ulap ON ulap.user_lesson_progress_id = ulp.progress_id
            JOIN public.lessons l_inner ON l_inner.lesson_id = ulp.lesson_id
            WHERE ulp.profile_id = profile_id_param
            GROUP BY ulp.lesson_id, l_inner.has_chat, l_inner.has_pronunciation, l_inner.has_dictation
        ) lc ON l.lesson_id = lc.lesson_id
    ),
    unit_completion AS (
        -- Step 2: Determine the completion status for every unit based on its lessons.
        SELECT
            u.unit_id,
            (COUNT(l.lesson_id) > 0 AND bool_and(lc.is_completed)) as is_completed
        FROM public.units u
        JOIN public.lessons l ON u.unit_id = l.unit_id
        JOIN lesson_completion lc ON l.lesson_id = lc.lesson_id
        GROUP BY u.unit_id
    ),
    progression_data AS (
        -- Step 3: Combine all data and use window functions to find previous item status.
        SELECT
            u.level,
            u.unit_id,
            u.unit_order,
            l.lesson_id,
            l.lesson_order,
            lc.is_completed AS lesson_is_completed,
            -- Check if the *previous* lesson in the same unit was completed. Default to TRUE for the first lesson.
            LAG(lc.is_completed, 1, TRUE) OVER (PARTITION BY l.unit_id ORDER BY l.lesson_order) AS prev_lesson_completed,
            -- Check if the *previous* unit in the same level was completed. Default to TRUE for the first unit.
            LAG(uc.is_completed, 1, TRUE) OVER (PARTITION BY u.level ORDER BY u.unit_order) AS prev_unit_completed
        FROM public.units u
        JOIN public.lessons l ON u.unit_id = l.unit_id
        LEFT JOIN lesson_completion lc ON l.lesson_id = lc.lesson_id
        LEFT JOIN unit_completion uc ON u.unit_id = uc.unit_id
    )
    -- Final Step: Calculate availability based on the chain of completion.
    SELECT
        pd.level,
        (pd.level IN (SELECT unnest(public.get_user_available_levels(profile_id_param)))) AS level_available,
        pd.unit_id,
        ((pd.level IN (SELECT unnest(public.get_user_available_levels(profile_id_param)))) AND pd.prev_unit_completed) AS unit_available,
        pd.lesson_id,
        ((pd.level IN (SELECT unnest(public.get_user_available_levels(profile_id_param)))) AND pd.prev_unit_completed AND pd.prev_lesson_completed) AS lesson_available,
        pd.lesson_is_completed
    FROM progression_data pd
    JOIN public.units u ON u.unit_id = pd.unit_id
    JOIN public.lessons l ON l.lesson_id = pd.lesson_id
    ORDER BY
        (SELECT sort_order FROM public.language_levels WHERE language_levels.level_code = u.level),
        u.unit_order,
        l.lesson_order;
END;
$$;


ALTER FUNCTION "public"."get_user_progression_status"("profile_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_chapter_added"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- When a new chapter is added, update all user progress for this book
    -- to reflect the new total and recalculate completion
    UPDATE public.user_audiobook_progress 
    SET 
        total_chapters = (
            SELECT COUNT(*) 
            FROM public.audiobook_chapters 
            WHERE book_id = NEW.book_id
        ),
        completion_percentage = (
            SELECT LEAST(100, CASE 
                WHEN COUNT(ac.*) > 0 THEN 
                    (COUNT(CASE WHEN uacp.is_completed THEN 1 END)::NUMERIC / COUNT(ac.*)::NUMERIC) * 100
                ELSE 0 
            END)
            FROM public.audiobook_chapters ac
            LEFT JOIN public.user_audiobook_chapter_progress uacp 
                ON ac.chapter_id = uacp.chapter_id 
                AND uacp.profile_id = user_audiobook_progress.profile_id
            WHERE ac.book_id = NEW.book_id
        ),
        is_completed = false, -- Reset completion status when new chapters are added
        completed_at = NULL   -- Clear completion timestamp
    WHERE book_id = NEW.book_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_chapter_added"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_subscription_tier_conflict"("user_profile_id" "uuid", "new_tier" "public"."subscription_tier_enum") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  existing_sub RECORD;
BEGIN
  -- If upgrading to pro, cancel any active starter subscriptions
  IF new_tier = 'pro' THEN
    FOR existing_sub IN
      SELECT ss.stripe_subscription_id
      FROM public.student_subscriptions ss
      JOIN public.prices pr ON ss.price_id = pr.id
      JOIN public.products p ON pr.product_id = p.id
      WHERE ss.profile_id = user_profile_id
      AND p.tier_key = 'starter'
      AND ss.status IN ('active', 'trialing')
      AND (ss.ended_at IS NULL OR ss.ended_at > NOW())
    LOOP
      -- Mark the subscription as canceled
      UPDATE public.student_subscriptions
      SET
        status = 'canceled',
        cancel_at_period_end = true,
        canceled_at = NOW(),
        updated_at = NOW()
      WHERE stripe_subscription_id = existing_sub.stripe_subscription_id;

      -- Log that this subscription was auto-canceled due to upgrade
      INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, notes)
      VALUES (user_profile_id, 0, 'SUBSCRIPTION_UPGRADE_CANCELLATION',
              'Starter subscription auto-canceled due to Pro upgrade: ' || existing_sub.stripe_subscription_id);
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION "public"."handle_subscription_tier_conflict"("user_profile_id" "uuid", "new_tier" "public"."subscription_tier_enum") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_streak"("profile_id_param" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_streak INT;
    last_streak_date DATE;
    new_streak INT;
    points_for_streak INT := 0;
    today DATE := current_date;
    yesterday DATE := current_date - 1;
BEGIN
    -- Get the user's current streak information
    SELECT 
        p.current_streak_days, 
        p.last_streak_date 
    INTO 
        current_streak, 
        last_streak_date
    FROM public.student_profiles p
    WHERE p.profile_id = profile_id_param;

    -- Only proceed if the user hasn't already performed an activity today
    IF last_streak_date IS NULL OR last_streak_date < today THEN
        -- Determine if the streak is continuing or resetting
        IF last_streak_date = yesterday THEN
            new_streak := COALESCE(current_streak, 0) + 1; -- Continue the streak
        ELSE
            new_streak := 1; -- Reset the streak
        END IF;

        -- Calculate points based on the new tiered logic
        -- 1. For every 5 days, the points-per-day increases by 1
        -- 2. LEAST() ensures the maximum points awarded per streak is 10
        points_for_streak := LEAST(floor((new_streak - 1) / 5) + 1, 10);

        -- Update the user's profile with the new streak information
        UPDATE public.student_profiles
        SET 
            current_streak_days = new_streak, 
            last_streak_date = today
        WHERE profile_id = profile_id_param;

        -- If points were awarded, log them
        IF points_for_streak > 0 THEN
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code)
            VALUES (profile_id_param, points_for_streak, 'STREAK_BONUS');
        END IF;

        -- Return the points awarded for this streak
        RETURN points_for_streak;
    END IF;

    -- If a streak was already awarded today, return 0 points
    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."handle_user_streak"("profile_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_word_pronunciation_update"("profile_id_param" "uuid", "language_code_param" character varying, "word_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_word_text TEXT := lower(word_data->>'word');
    v_accuracy_score NUMERIC := (word_data->>'accuracyScore')::NUMERIC;
    v_error_type TEXT := word_data->>'errorType';
    v_error_increment INT;
BEGIN
    -- Exit if essential data is missing
    IF v_word_text IS NULL OR v_accuracy_score IS NULL THEN
        RETURN;
    END IF;

    -- Determine if the attempt had an error
    v_error_increment := CASE WHEN v_error_type IS NOT NULL AND v_error_type <> 'None' THEN 1 ELSE 0 END;

    -- Upsert the word pronunciation record, setting `needs_practice` based on the CURRENT attempt's score.
    INSERT INTO public.user_word_pronunciation (
        profile_id, word_text, language_code, total_attempts, error_count,
        sum_accuracy_score, average_accuracy_score, last_accuracy_score,
        last_error_type, last_attempt_at, updated_at, needs_practice
    )
    VALUES (
        profile_id_param, v_word_text, language_code_param, 1, v_error_increment,
        v_accuracy_score, v_accuracy_score, v_accuracy_score, v_error_type,
        NOW(), NOW(), (v_accuracy_score < 70) -- Correct logic on insert
    )
    ON CONFLICT (profile_id, word_text, language_code) DO UPDATE
    SET
        total_attempts = user_word_pronunciation.total_attempts + 1,
        error_count = user_word_pronunciation.error_count + v_error_increment,
        sum_accuracy_score = user_word_pronunciation.sum_accuracy_score + v_accuracy_score,
        average_accuracy_score = (user_word_pronunciation.sum_accuracy_score + v_accuracy_score) / (user_word_pronunciation.total_attempts + 1),
        last_accuracy_score = v_accuracy_score,
        last_error_type = v_error_type,
        last_attempt_at = NOW(),
        updated_at = NOW(),
        needs_practice = (v_accuracy_score < 70); -- Correct logic on update

END;
$$;


ALTER FUNCTION "public"."handle_user_word_pronunciation_update"("profile_id_param" "uuid", "language_code_param" character varying, "word_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_lesson_complete"("p_profile_id" "uuid", "p_lesson_id" integer) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_lesson_progress ulp
    JOIN public.user_lesson_activity_progress ulap ON ulap.user_lesson_progress_id = ulp.progress_id
    JOIN public.lessons l ON l.lesson_id = ulp.lesson_id
    WHERE ulp.profile_id = p_profile_id
      AND ulp.lesson_id = p_lesson_id
    GROUP BY l.lesson_id -- Group by lesson to count activities for that specific lesson
    HAVING COUNT(CASE WHEN ulap.status = 'completed' THEN 1 END) =
           (
             CASE WHEN l.has_chat THEN 1 ELSE 0 END +
             CASE WHEN l.has_pronunciation THEN 1 ELSE 0 END +
             CASE WHEN l.has_dictation THEN 1 ELSE 0 END
           )
  );
$$;


ALTER FUNCTION "public"."is_lesson_complete"("p_profile_id" "uuid", "p_lesson_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_unit_complete"("p_profile_id" "uuid", "p_unit_id" integer) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    -- A unit is complete if it has lessons and none of them are incomplete.
    (SELECT COUNT(*) FROM public.lessons WHERE unit_id = p_unit_id) > 0
    AND
    (
      SELECT COUNT(*)
      FROM public.lessons l
      WHERE l.unit_id = p_unit_id
      AND NOT public.is_lesson_complete(p_profile_id, l.lesson_id)
    ) = 0;
$$;


ALTER FUNCTION "public"."is_unit_complete"("p_profile_id" "uuid", "p_unit_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_chat_completion"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying) RETURNS TABLE("points_awarded_total" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
v_lesson_progress_id INT;
v_unit_id INT;
was_already_completed BOOLEAN;
total_points_awarded INT := 0;
BEGIN
SELECT EXISTS(
    SELECT 1 FROM public.user_points_log
    WHERE profile_id = profile_id_param 
    AND related_lesson_id = lesson_id_param
    AND reason_code = 'CHAT_COMPLETION'
) INTO was_already_completed;

    -- If already completed, return 0 points
    IF was_already_completed THEN
        RETURN QUERY SELECT 0;
        RETURN;
    END IF;

    -- Ensure user_lesson_progress exists
    INSERT INTO public.user_lesson_progress (profile_id, lesson_id, last_progress_at)
    VALUES (profile_id_param, lesson_id_param, NOW())
    ON CONFLICT (profile_id, lesson_id) DO UPDATE SET last_progress_at = NOW();

    SELECT progress_id INTO v_lesson_progress_id
    FROM public.user_lesson_progress
    WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param;

    -- Mark chat activity as completed
    INSERT INTO public.user_lesson_activity_progress (user_lesson_progress_id, activity_type, status, completed_at)
    VALUES (v_lesson_progress_id, 'chat', 'completed', NOW())
    ON CONFLICT (user_lesson_progress_id, activity_type)
    DO UPDATE SET status = 'completed', completed_at = NOW();

    -- Award 5 points for chat completion
    total_points_awarded := 5;

    INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, activity_type)
    VALUES (profile_id_param, 5, 'CHAT_COMPLETION', lesson_id_param, 'chat');

    -- Update user's total points
    UPDATE public.student_profiles
    SET points = points + 5
    WHERE profile_id = profile_id_param;

    -- Check for unit completion bonus
    SELECT unit_id INTO v_unit_id FROM public.lessons WHERE lesson_id = lesson_id_param;
    PERFORM public.check_and_award_unit_completion_bonus(profile_id_param, v_unit_id, lesson_id_param);

    RETURN QUERY SELECT total_points_awarded;

END;
$$;


ALTER FUNCTION "public"."process_chat_completion"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_user_activity"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying, "activity_type_param" "public"."activity_type_enum", "phrase_id_param" integer DEFAULT NULL::integer, "reference_text_param" "text" DEFAULT NULL::"text", "recognized_text_param" "text" DEFAULT NULL::"text", "accuracy_score_param" numeric DEFAULT NULL::numeric, "fluency_score_param" numeric DEFAULT NULL::numeric, "completeness_score_param" numeric DEFAULT NULL::numeric, "pronunciation_score_param" numeric DEFAULT NULL::numeric, "prosody_score_param" numeric DEFAULT NULL::numeric, "phonetic_data_param" "jsonb" DEFAULT NULL::"jsonb", "written_text_param" "text" DEFAULT NULL::"text", "overall_similarity_score_param" numeric DEFAULT NULL::numeric, "word_level_feedback_param" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("points_awarded_total" integer)
    LANGUAGE "plpgsql"
    AS $$DECLARE
v_lesson_progress_id INT;
v_activity_progress_id INT;
v_unit_id INT;

    -- Attempt & Progress Tracking
    next_attempt_number INT;
    was_phrase_already_completed BOOLEAN;
    is_phrase_now_completed BOOLEAN;
    was_activity_already_completed BOOLEAN;
    total_phrases_in_lesson INT;
    phrases_completed_for_activity INT;
    v_score NUMERIC;

    -- Points
    total_points_for_this_attempt INT := 0;

    -- Word-level loop variables (for pronunciation)
    word_record JSONB;
    v_word_text TEXT;
    v_accuracy_score NUMERIC;
    word_needs_practice BOOLEAN;

    -- No longer need streak variables here

BEGIN
total_points_for_this_attempt := total_points_for_this_attempt + public.handle_user_streak(profile_id_param);

    -- Step 2: Ensure user_lesson_progress exists for all activity types
    INSERT INTO public.user_lesson_progress (profile_id, lesson_id, last_progress_at)
    VALUES (profile_id_param, lesson_id_param, NOW())
    ON CONFLICT (profile_id, lesson_id) DO UPDATE SET last_progress_at = NOW()
    RETURNING progress_id INTO v_lesson_progress_id;

    IF v_lesson_progress_id IS NULL THEN
      SELECT progress_id INTO v_lesson_progress_id FROM public.user_lesson_progress
      WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param;
    END IF;

    -- Step 3: Handle activity progress creation for all activity types
    SELECT activity_progress_id, (status = 'completed')
    INTO v_activity_progress_id, was_activity_already_completed
    FROM public.user_lesson_activity_progress
    WHERE user_lesson_progress_id = v_lesson_progress_id AND activity_type = activity_type_param;

    IF v_activity_progress_id IS NULL THEN
        INSERT INTO public.user_lesson_activity_progress (user_lesson_progress_id, activity_type, status, started_at)
        VALUES (v_lesson_progress_id, activity_type_param, 'in_progress', NOW())
        RETURNING activity_progress_id INTO v_activity_progress_id;
        was_activity_already_completed := FALSE;
    END IF;

    -- Step 4: Handle chat activity (no phrase_id required)
    IF activity_type_param = 'chat' THEN
        -- The streak logic that was here is now handled at the start of the function.
        -- We only need to handle the final point update and return.

        -- Update total points if any were awarded from the streak
        IF total_points_for_this_attempt > 0 THEN
            UPDATE public.student_profiles SET points = points + total_points_for_this_attempt
            WHERE profile_id = profile_id_param;
        END IF;

        RETURN QUERY SELECT total_points_for_this_attempt;
        RETURN;
    END IF;

    -- Existing logic for pronunciation and dictation (requires phrase_id)
    IF phrase_id_param IS NULL THEN
        RAISE EXCEPTION 'phrase_id_param is required for % activity', activity_type_param;
    END IF;

    -- #############################################################
    -- ### NECESSARY CORRECTION ADDED HERE ###
    -- #############################################################
    -- Ensure the provided phrase_id is actually part of the provided lesson_id
    IF NOT EXISTS (
        SELECT 1
        FROM public.lesson_phrases
        WHERE lesson_id = lesson_id_param AND phrase_id = phrase_id_param
    ) THEN
        RAISE EXCEPTION 'Phrase ID % is not part of Lesson ID %.', phrase_id_param, lesson_id_param;
    END IF;
    -- #############################################################

    -- Step 5: Insert the specific attempt record
    IF activity_type_param = 'pronunciation' THEN
        -- ... (rest of the function remains the same)
        SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO next_attempt_number FROM public.speech_attempts WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
        INSERT INTO public.speech_attempts (profile_id, lesson_id, phrase_id, language_code, attempt_number, reference_text, recognized_text, accuracy_score, fluency_score, completeness_score, pronunciation_score, prosody_score, phonetic_data) VALUES (profile_id_param, lesson_id_param, phrase_id_param, language_code_param, next_attempt_number, reference_text_param, recognized_text_param, accuracy_score_param, fluency_score_param, completeness_score_param, pronunciation_score_param, prosody_score_param, phonetic_data_param);
        v_score := accuracy_score_param;
    ELSIF activity_type_param = 'dictation' THEN
        SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO next_attempt_number FROM public.dictation_attempts WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
        INSERT INTO public.dictation_attempts (profile_id, lesson_id, phrase_id, language_code, attempt_number, reference_text, written_text, overall_similarity_score, word_level_feedback) VALUES (profile_id_param, lesson_id_param, phrase_id_param, language_code_param, next_attempt_number, reference_text_param, written_text_param, overall_similarity_score_param, word_level_feedback_param);
        v_score := overall_similarity_score_param;
    END IF;

    -- Step 6: Handle word-level analytics (for pronunciation only)
    -- ... (logic remains the same)
    IF activity_type_param = 'pronunciation' AND jsonb_typeof(phonetic_data_param->'words') = 'array' THEN
        FOR word_record IN SELECT * FROM jsonb_array_elements(phonetic_data_param->'words') LOOP
            v_word_text := lower(word_record->>'word');
            v_accuracy_score := (word_record->>'accuracyScore')::numeric;
            IF v_word_text IS NOT NULL AND v_accuracy_score IS NOT NULL THEN
                SELECT needs_practice INTO word_needs_practice FROM public.user_word_pronunciation WHERE profile_id = profile_id_param AND word_text = v_word_text AND language_code = language_code_param;
                IF COALESCE(word_needs_practice, false) AND v_accuracy_score >= 70 THEN
                    total_points_for_this_attempt := total_points_for_this_attempt + 1;
                    INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_word_text, related_word_language_code, related_phrase_id, activity_type) VALUES (profile_id_param, 1, 'COMEBACK_BONUS', v_word_text, language_code_param, phrase_id_param, 'pronunciation');
                END IF;
                PERFORM public.handle_user_word_pronunciation_update(profile_id_param, language_code_param, word_record);
            END IF;
        END LOOP;
    END IF;

    -- Step 7: Upsert phrase progress & handle phrase-level bonuses
    -- ... (logic remains the same)
    is_phrase_now_completed := (v_score >= 70);
    IF activity_type_param = 'pronunciation' THEN
        SELECT pronunciation_completed INTO was_phrase_already_completed FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    ELSIF activity_type_param = 'dictation' THEN
        SELECT dictation_completed INTO was_phrase_already_completed FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    END IF;
    was_phrase_already_completed := COALESCE(was_phrase_already_completed, false);
    IF NOT was_phrase_already_completed AND is_phrase_now_completed THEN
        IF next_attempt_number = 1 THEN
            total_points_for_this_attempt := total_points_for_this_attempt + 1;
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, related_phrase_id, activity_type) VALUES (profile_id_param, 1, 'FIRST_TRY_BONUS', lesson_id_param, phrase_id_param, activity_type_param);
        END IF;
        IF v_score >= 90 THEN
            total_points_for_this_attempt := total_points_for_this_attempt + 1;
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, related_phrase_id, activity_type) VALUES (profile_id_param, 1, 'PHRASE_ACCURACY_BONUS', lesson_id_param, phrase_id_param, activity_type_param);
        END IF;
    END IF;
    INSERT INTO public.user_phrase_progress (profile_id, lesson_id, phrase_id, language_code) VALUES (profile_id_param, lesson_id_param, phrase_id_param, language_code_param) ON CONFLICT (profile_id, lesson_id, phrase_id, language_code) DO NOTHING;
    IF activity_type_param = 'pronunciation' THEN
        UPDATE public.user_phrase_progress SET pronunciation_attempts = COALESCE(pronunciation_attempts, 0) + 1, pronunciation_last_attempt_at = NOW(), pronunciation_completed = was_phrase_already_completed OR is_phrase_now_completed, last_progress_at = NOW() WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    ELSIF activity_type_param = 'dictation' THEN
        UPDATE public.user_phrase_progress SET dictation_attempts = COALESCE(dictation_attempts, 0) + 1, dictation_last_attempt_at = NOW(), dictation_completed = was_phrase_already_completed OR is_phrase_now_completed, last_progress_at = NOW() WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND phrase_id = phrase_id_param;
    END IF;

    -- Step 8: Handle Activity Completion for phrase-based activities
    -- ... (logic remains the same)
    IF NOT COALESCE(was_activity_already_completed, false) THEN
        SELECT COUNT(*) INTO total_phrases_in_lesson FROM public.lesson_phrases WHERE lesson_id = lesson_id_param;
        IF activity_type_param = 'pronunciation' THEN
            SELECT COUNT(*) INTO phrases_completed_for_activity FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND pronunciation_completed = TRUE;
        ELSIF activity_type_param = 'dictation' THEN
            SELECT COUNT(*) INTO phrases_completed_for_activity FROM public.user_phrase_progress WHERE profile_id = profile_id_param AND lesson_id = lesson_id_param AND dictation_completed = TRUE;
        END IF;
        IF phrases_completed_for_activity >= total_phrases_in_lesson THEN
            UPDATE public.user_lesson_activity_progress SET status = 'completed', completed_at = NOW() WHERE activity_progress_id = v_activity_progress_id;
            total_points_for_this_attempt := total_points_for_this_attempt + 10;
            INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_lesson_id, activity_type) VALUES (profile_id_param, 10, 'ACTIVITY_COMPLETION', lesson_id_param, activity_type_param);
            SELECT l.unit_id INTO v_unit_id FROM public.lessons l WHERE l.lesson_id = lesson_id_param;
            PERFORM public.check_and_award_unit_completion_bonus(profile_id_param, v_unit_id, lesson_id_param);
        END IF;
    END IF;

    -- --- REMOVED ---
    -- The old streak logic from Step 8 has been removed.

    -- Step 9: Final point update
    IF total_points_for_this_attempt > 0 THEN
        UPDATE public.student_profiles SET points = points + total_points_for_this_attempt
        WHERE profile_id = profile_id_param;
    END IF;

    RETURN QUERY SELECT total_points_for_this_attempt;

END;$$;


ALTER FUNCTION "public"."process_user_activity"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying, "activity_type_param" "public"."activity_type_enum", "phrase_id_param" integer, "reference_text_param" "text", "recognized_text_param" "text", "accuracy_score_param" numeric, "fluency_score_param" numeric, "completeness_score_param" numeric, "pronunciation_score_param" numeric, "prosody_score_param" numeric, "phonetic_data_param" "jsonb", "written_text_param" "text", "overall_similarity_score_param" numeric, "word_level_feedback_param" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_word_practice_attempt"("profile_id_param" "uuid", "word_text_param" character varying, "language_code_param" character varying, "accuracy_score_param" numeric) RETURNS TABLE("success" boolean, "word_completed" boolean, "new_average_score" numeric, "total_attempts" integer, "points_awarded" integer, "needs_practice" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    word_jsonb jsonb;
    points_for_this_attempt integer := 0;
    was_needing_practice boolean;
    is_now_completed boolean;
    v_new_average_score numeric;
    v_total_attempts integer;
    v_needs_practice boolean;
BEGIN
    -- Check if the word was previously needing practice for a potential bonus
    SELECT uwp.needs_practice INTO was_needing_practice
    FROM public.user_word_pronunciation uwp
    WHERE uwp.profile_id = profile_id_param
      AND uwp.word_text = word_text_param
      AND uwp.language_code = language_code_param;

    -- Construct the JSONB object that handle_user_word_pronunciation_update expects
    word_jsonb := jsonb_build_object(
        'word', word_text_param,
        'accuracyScore', accuracy_score_param,
        'errorType', 'None'
    );

    -- Call the centralized word update logic.
    -- Note: handle_user_word_pronunciation_update now also sets the `needs_practice` flag.
    PERFORM public.handle_user_word_pronunciation_update(profile_id_param, language_code_param, word_jsonb);

    -- Get the updated word stats to return to the client
    SELECT uwp.average_accuracy_score, uwp.total_attempts, uwp.needs_practice
    INTO v_new_average_score, v_total_attempts, v_needs_practice
    FROM public.user_word_pronunciation uwp
    WHERE uwp.profile_id = profile_id_param
      AND uwp.word_text = word_text_param
      AND uwp.language_code = language_code_param;

    -- Award a "comeback bonus" if a difficult word is now mastered
    is_now_completed := v_new_average_score >= 70;
    IF COALESCE(was_needing_practice, false) AND is_now_completed THEN
        points_for_this_attempt := points_for_this_attempt + 1;
        INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, related_word_text, related_word_language_code)
        VALUES (profile_id_param, 1, 'COMEBACK_BONUS', word_text_param, language_code_param);
    END IF;

    -- Update user's total points if any were awarded
    IF points_for_this_attempt > 0 THEN
        UPDATE public.student_profiles
        SET points = points + points_for_this_attempt, updated_at = now()
        WHERE profile_id = profile_id_param;
    END IF;

    -- Return the results for the client to update the UI
    RETURN QUERY SELECT
        true as success,
        is_now_completed as word_completed,
        v_new_average_score as new_average_score,
        v_total_attempts as total_attempts,
        points_for_this_attempt as points_awarded,
        v_needs_practice as needs_practice;
END;
$$;


ALTER FUNCTION "public"."process_word_practice_attempt"("profile_id_param" "uuid", "word_text_param" character varying, "language_code_param" character varying, "accuracy_score_param" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_partnership_invitation"("p_token" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
  v_result jsonb;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = p_user_id;
  
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM partnership_invitations
  WHERE token = p_token
  AND status = 'pending'
  AND expires_at > now();
  
  -- Validate invitation
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid');
  END IF;
  
  -- Check email match
  IF v_invitation.intended_for_email != v_user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'wrong_email');
  END IF;
  
  -- Update invitation (this bypasses RLS due to SECURITY DEFINER)
  UPDATE partnership_invitations
  SET 
    status = 'redeemed',
    redeemed_by_profile_id = p_user_id,
    redeemed_at = now()
  WHERE id = v_invitation.id;
  
  -- Update user profiles
  UPDATE profiles
  SET partnership_id = v_invitation.partnership_id
  WHERE id = p_user_id;
  
  -- Return success with invitation details
  RETURN jsonb_build_object(
    'success', true,
    'invitation', row_to_json(v_invitation)
  );
END;
$$;


ALTER FUNCTION "public"."redeem_partnership_invitation"("p_token" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_audiobook_duration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    -- Log trigger execution
    RAISE NOTICE 'update_audiobook_duration triggered: operation=%, book_id=%', 
        TG_OP, COALESCE(NEW.book_id, OLD.book_id);
    
    -- Update the audiobook's total duration when chapter duration changes
    UPDATE public.audiobooks 
    SET 
        duration_seconds = (
            SELECT COALESCE(SUM(duration_seconds), 0)
            FROM public.audiobook_chapters 
            WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
            AND duration_seconds IS NOT NULL
        ),
        updated_at = now()
    WHERE book_id = COALESCE(NEW.book_id, OLD.book_id);
    
    -- Log the result
    RAISE NOTICE 'Audiobook duration updated for book_id=%: new_duration=%', 
        COALESCE(NEW.book_id, OLD.book_id),
        (SELECT duration_seconds FROM public.audiobooks WHERE book_id = COALESCE(NEW.book_id, OLD.book_id));
    
    RETURN COALESCE(NEW, OLD);
END;$$;


ALTER FUNCTION "public"."update_audiobook_duration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chapter_progress"("p_profile_id" "uuid", "p_book_id" integer, "p_chapter_id" integer, "p_position_seconds" numeric, "p_chapter_duration_seconds" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_is_completed BOOLEAN := false;
    v_completion_threshold NUMERIC := 0.95;
BEGIN
    -- Determine if chapter is completed (95% watched or explicit completion)
    IF p_chapter_duration_seconds IS NOT NULL AND p_position_seconds >= (p_chapter_duration_seconds * v_completion_threshold) THEN
        v_is_completed := true;
    END IF;
    
    -- Upsert chapter progress with FIXED logic
    INSERT INTO public.user_audiobook_chapter_progress (
        profile_id, book_id, chapter_id, current_position_seconds, 
        is_completed, completed_at, last_listened_at, created_at, updated_at
    )
    VALUES (
        p_profile_id, p_book_id, p_chapter_id, p_position_seconds,
        v_is_completed, 
        CASE WHEN v_is_completed THEN now() ELSE NULL END,
        now(), now(), now()
    )
    ON CONFLICT (profile_id, book_id, chapter_id)
    DO UPDATE SET
        current_position_seconds = EXCLUDED.current_position_seconds,
        -- FIXED: Allow completion to be set to true when threshold is met
        is_completed = CASE 
            WHEN user_audiobook_chapter_progress.is_completed = true THEN true  -- Keep completed status
            WHEN EXCLUDED.is_completed = true THEN true  -- Allow new completion
            ELSE false  -- Otherwise keep as incomplete
        END,
        completed_at = CASE 
            WHEN user_audiobook_chapter_progress.completed_at IS NOT NULL THEN user_audiobook_chapter_progress.completed_at  -- Keep existing completion time
            WHEN EXCLUDED.is_completed = true AND user_audiobook_chapter_progress.is_completed = false THEN now()  -- Set completion time for newly completed
            ELSE NULL 
        END,
        last_listened_at = EXCLUDED.last_listened_at,
        updated_at = EXCLUDED.updated_at;
    
    -- Update book-level progress
    WITH book_stats AS (
        SELECT * FROM public.calculate_book_completion(p_profile_id, p_book_id)
    )
    INSERT INTO public.user_audiobook_progress (
        profile_id, book_id, current_chapter_id, current_position_seconds,
        total_chapters, completed_chapters, completion_percentage,
        is_completed, completed_at, last_read_at
    )
    SELECT 
        p_profile_id, p_book_id, p_chapter_id, p_position_seconds,
        bs.total_chapters, bs.completed_chapters, LEAST(100, bs.completion_percentage),
        bs.is_book_completed, 
        CASE WHEN bs.is_book_completed THEN now() ELSE NULL END,
        now()
    FROM book_stats bs
    ON CONFLICT (profile_id, book_id)
    DO UPDATE SET
        current_chapter_id = EXCLUDED.current_chapter_id,
        current_position_seconds = EXCLUDED.current_position_seconds,
        total_chapters = EXCLUDED.total_chapters,
        completed_chapters = EXCLUDED.completed_chapters,
        completion_percentage = LEAST(100, EXCLUDED.completion_percentage),
        -- FIXED: Same logic fix for book completion
        is_completed = CASE 
            WHEN user_audiobook_progress.is_completed = true THEN true
            WHEN EXCLUDED.is_completed = true THEN true
            ELSE false
        END,
        completed_at = CASE 
            WHEN user_audiobook_progress.completed_at IS NOT NULL THEN user_audiobook_progress.completed_at
            WHEN EXCLUDED.is_completed = true AND user_audiobook_progress.is_completed = false THEN now()
            ELSE NULL
        END,
        last_read_at = EXCLUDED.last_read_at;
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_chapter_progress"("p_profile_id" "uuid", "p_book_id" integer, "p_chapter_id" integer, "p_position_seconds" numeric, "p_chapter_duration_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_subscription_tier"("user_profile_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_tier TEXT;
BEGIN
  -- Get the highest tier the user should have
  new_tier := public.get_user_highest_tier(user_profile_id);

  -- Update the user's subscription tier
  UPDATE public.student_profiles
  SET
    subscription_tier = new_tier::public.subscription_tier_enum,
    updated_at = NOW()
  WHERE profile_id = user_profile_id;

  RETURN new_tier;
END;
$$;


ALTER FUNCTION "public"."update_user_subscription_tier"("user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_audiobook_purchase"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_invoice_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_profile_id UUID;
  v_book_id INTEGER;
  v_amount_paid INTEGER;
BEGIN
  -- Get profile_id from stripe_customer_id
  SELECT profile_id INTO v_profile_id
  FROM student_profiles
  WHERE stripe_customer_id = p_stripe_customer_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Customer not found: %', p_stripe_customer_id;
  END IF;

  -- Extract book_id from invoice metadata (fixed JSONB access)
  v_book_id := (p_invoice_data->'metadata'->>'book_id')::INTEGER;
  v_amount_paid := (p_invoice_data->>'amount_paid')::INTEGER;

  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Book ID not found in invoice metadata';
  END IF;

  -- Insert purchase record
  INSERT INTO user_audiobook_purchases (
    profile_id,
    book_id,
    purchase_type,
    amount_paid_cents,
    purchased_at
  ) VALUES (
    v_profile_id,
    v_book_id,
    'money',
    v_amount_paid,
    NOW()
  ) ON CONFLICT (profile_id, book_id) DO NOTHING;

  -- Insert/update invoice record
  INSERT INTO invoices (
    profile_id,
    stripe_invoice_id,
    stripe_customer_id,
    status,
    amount_due,
    amount_paid,
    amount_remaining,
    currency,
    paid_at,
    invoice_pdf_url,
    hosted_invoice_url,
    metadata,
    issued_at
  ) VALUES (
    v_profile_id,
    p_stripe_invoice_id,
    p_stripe_customer_id,
    (p_invoice_data->>'status')::invoice_status_enum,
    COALESCE((p_invoice_data->>'amount_due')::INTEGER, 0),
    COALESCE((p_invoice_data->>'amount_paid')::INTEGER, 0),
    COALESCE((p_invoice_data->>'amount_remaining')::INTEGER, 0),
    COALESCE(p_invoice_data->>'currency', 'usd'),
    CASE WHEN p_invoice_data->>'status' = 'paid' THEN NOW() ELSE NULL END,
    p_invoice_data->>'invoice_pdf',
    p_invoice_data->>'hosted_invoice_url',
    p_invoice_data,
    TO_TIMESTAMP((p_invoice_data->>'created')::INTEGER)
  ) ON CONFLICT (stripe_invoice_id) DO UPDATE SET
    status = EXCLUDED.status,
    amount_paid = EXCLUDED.amount_paid,
    amount_remaining = EXCLUDED.amount_remaining,
    paid_at = EXCLUDED.paid_at,
    invoice_pdf_url = EXCLUDED.invoice_pdf_url,
    hosted_invoice_url = EXCLUDED.hosted_invoice_url,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

END;
$$;


ALTER FUNCTION "public"."upsert_audiobook_purchase"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_invoice_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_stripe_invoice"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_invoice_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Get user profile
  SELECT sp.profile_id INTO user_profile_id
  FROM public.student_profiles sp
  WHERE sp.stripe_customer_id = p_stripe_customer_id;

  IF user_profile_id IS NULL THEN
    RAISE WARNING 'Webhook Error: No user profile found for customer: %', p_stripe_customer_id;
    RETURN FALSE;
  END IF;

  -- Upsert invoice record with proper NULL handling
  INSERT INTO public.invoices (
    profile_id, stripe_invoice_id, stripe_subscription_id, stripe_customer_id,
    status, amount_due, amount_paid, amount_remaining, currency,
    due_date, paid_at, invoice_pdf_url, hosted_invoice_url,
    billing_reason, metadata, issued_at, updated_at
  )
  VALUES (
    user_profile_id,
    p_stripe_invoice_id,
    NULLIF(p_stripe_subscription_id, ''),
    p_stripe_customer_id,
    (p_invoice_data->>'status')::public.invoice_status_enum,
    COALESCE((p_invoice_data->>'amount_due')::INTEGER, 0),
    COALESCE((p_invoice_data->>'amount_paid')::INTEGER, 0),
    COALESCE((p_invoice_data->>'amount_remaining')::INTEGER, 0),
    COALESCE(p_invoice_data->>'currency', 'usd'),
    CASE WHEN p_invoice_data->>'due_date' IS NOT NULL AND p_invoice_data->>'due_date' != 'null'
    THEN TO_TIMESTAMP((p_invoice_data->>'due_date')::BIGINT) 
    ELSE NULL END,
    CASE WHEN p_invoice_data->>'status' = 'paid' AND p_invoice_data->'status_transitions'->>'paid_at' IS NOT NULL
    THEN TO_TIMESTAMP((p_invoice_data->'status_transitions'->>'paid_at')::BIGINT) 
    ELSE NULL END,
    p_invoice_data->>'invoice_pdf',
    p_invoice_data->>'hosted_invoice_url',
    p_invoice_data->>'billing_reason',
    COALESCE(p_invoice_data->'metadata', '{}'::jsonb),
    COALESCE(
      CASE WHEN p_invoice_data->>'created' IS NOT NULL 
      THEN TO_TIMESTAMP((p_invoice_data->>'created')::BIGINT)
      ELSE NOW() END,
      NOW()
    ),
    NOW()
  )
  ON CONFLICT (stripe_invoice_id)
  DO UPDATE SET
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    status = EXCLUDED.status,
    amount_due = EXCLUDED.amount_due,
    amount_paid = EXCLUDED.amount_paid,
    amount_remaining = EXCLUDED.amount_remaining,
    due_date = EXCLUDED.due_date,
    paid_at = EXCLUDED.paid_at,
    invoice_pdf_url = EXCLUDED.invoice_pdf_url,
    hosted_invoice_url = EXCLUDED.hosted_invoice_url,
    billing_reason = EXCLUDED.billing_reason,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."upsert_stripe_invoice"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_invoice_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_stripe_subscription"("p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_subscription_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_profile_id UUID;
  price_record RECORD;
  tier_before TEXT;
  tier_after TEXT;
BEGIN
  -- Get user profile
  SELECT sp.profile_id INTO user_profile_id
  FROM public.student_profiles sp
  WHERE sp.stripe_customer_id = p_stripe_customer_id;

  IF user_profile_id IS NULL THEN
    RAISE WARNING 'Webhook Error: No user profile found for customer: %', p_stripe_customer_id;
    RETURN FALSE;
  END IF;

  -- Get price and product information
  SELECT p.id, prod.tier_key
  INTO price_record
  FROM public.prices p
  JOIN public.products prod ON p.product_id = prod.id
  WHERE p.stripe_price_id = p_stripe_price_id;

  IF price_record.id IS NULL THEN
    RAISE WARNING 'Webhook Error: Price not found in database: %', p_stripe_price_id;
    RETURN FALSE;
  END IF;

  -- Store current tier
  SELECT sp.subscription_tier INTO tier_before
  FROM public.student_profiles sp
  WHERE sp.profile_id = user_profile_id;

  -- Handle tier conflicts if this is a new active subscription
  IF p_subscription_data->>'status' IN ('active', 'trialing') THEN
    PERFORM public.handle_subscription_tier_conflict(user_profile_id, price_record.tier_key);
  END IF;

  -- Upsert subscription record with proper NULL handling
  INSERT INTO public.student_subscriptions (
    profile_id, price_id, stripe_subscription_id, status, quantity,
    current_period_start, current_period_end, cancel_at_period_end,
    canceled_at, ended_at, trial_start_at, trial_end_at, metadata,
    stripe_created_at, updated_at
  )
  VALUES (
    user_profile_id, 
    price_record.id, 
    p_stripe_subscription_id,
    (p_subscription_data->>'status')::public.subscription_status_enum,
    COALESCE((p_subscription_data->>'quantity')::INTEGER, 1),
    COALESCE(
      CASE WHEN p_subscription_data->>'current_period_start' IS NOT NULL 
      THEN TO_TIMESTAMP((p_subscription_data->>'current_period_start')::BIGINT)
      ELSE NOW() END,
      NOW()
    ),
    COALESCE(
      CASE WHEN p_subscription_data->>'current_period_end' IS NOT NULL 
      THEN TO_TIMESTAMP((p_subscription_data->>'current_period_end')::BIGINT)
      ELSE NOW() + INTERVAL '1 month' END,
      NOW() + INTERVAL '1 month'
    ),
    COALESCE((p_subscription_data->>'cancel_at_period_end')::BOOLEAN, false),
    CASE WHEN p_subscription_data->>'canceled_at' IS NOT NULL 
    THEN TO_TIMESTAMP((p_subscription_data->>'canceled_at')::BIGINT) 
    ELSE NULL END,
    CASE WHEN p_subscription_data->>'ended_at' IS NOT NULL 
    THEN TO_TIMESTAMP((p_subscription_data->>'ended_at')::BIGINT) 
    ELSE NULL END,
    CASE WHEN p_subscription_data->>'trial_start' IS NOT NULL 
    THEN TO_TIMESTAMP((p_subscription_data->>'trial_start')::BIGINT) 
    ELSE NULL END,
    CASE WHEN p_subscription_data->>'trial_end' IS NOT NULL 
    THEN TO_TIMESTAMP((p_subscription_data->>'trial_end')::BIGINT) 
    ELSE NULL END,
    COALESCE(p_subscription_data->'metadata', '{}'::jsonb),
    COALESCE(
      CASE WHEN p_subscription_data->>'created' IS NOT NULL 
      THEN TO_TIMESTAMP((p_subscription_data->>'created')::BIGINT)
      ELSE NOW() END,
      NOW()
    ),
    NOW()
  )
  ON CONFLICT (stripe_subscription_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    quantity = EXCLUDED.quantity,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    canceled_at = EXCLUDED.canceled_at,
    ended_at = EXCLUDED.ended_at,
    trial_start_at = EXCLUDED.trial_start_at,
    trial_end_at = EXCLUDED.trial_end_at,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  -- Update user's subscription tier based on all active subscriptions
  tier_after := public.update_user_subscription_tier(user_profile_id);

  -- Log tier change if it occurred
  IF tier_before::TEXT != tier_after THEN
    INSERT INTO public.user_points_log (profile_id, points_awarded, reason_code, notes)
    VALUES (user_profile_id, 0, 'TIER_CHANGE',
            'Subscription tier changed from ' || tier_before::TEXT || ' to ' || tier_after);
  END IF;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."upsert_stripe_subscription"("p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_subscription_data" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audiobook_alignment" (
    "alignment_id" integer NOT NULL,
    "book_id" integer NOT NULL,
    "chapter_id" integer,
    "full_text" "text" NOT NULL,
    "characters_data" "jsonb" NOT NULL,
    "words_data" "jsonb" NOT NULL,
    "loss_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audiobook_alignment" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audiobook_alignment_alignment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audiobook_alignment_alignment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audiobook_alignment_alignment_id_seq" OWNED BY "public"."audiobook_alignment"."alignment_id";



CREATE TABLE IF NOT EXISTS "public"."audiobook_chapters" (
    "chapter_id" integer NOT NULL,
    "book_id" integer NOT NULL,
    "chapter_title" "text" NOT NULL,
    "audio_url" "text",
    "duration_seconds" integer,
    "is_free_sample" boolean DEFAULT false,
    "chapter_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "video_url" "text"
);


ALTER TABLE "public"."audiobook_chapters" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audiobook_chapters_chapter_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audiobook_chapters_chapter_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audiobook_chapters_chapter_id_seq" OWNED BY "public"."audiobook_chapters"."chapter_id";



CREATE TABLE IF NOT EXISTS "public"."audiobooks" (
    "book_id" integer NOT NULL,
    "title" character varying NOT NULL,
    "author" character varying NOT NULL,
    "description" "text",
    "cover_image_url" character varying,
    "language_code" character varying NOT NULL,
    "level_code" "public"."level_enum" NOT NULL,
    "duration_seconds" integer,
    "points_cost" integer DEFAULT 0 NOT NULL,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audiobooks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audiobooks_book_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audiobooks_book_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audiobooks_book_id_seq" OWNED BY "public"."audiobooks"."book_id";



CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "message_id" bigint NOT NULL,
    "conversation_id" bigint NOT NULL,
    "sender_type" "public"."sender_type_enum" NOT NULL,
    "message_order" integer NOT NULL,
    "message_text" "text" NOT NULL,
    "message_language_code" character varying(5) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "related_prompt_id" integer,
    "feedback_text" "text",
    "feedback_language_code" character varying(5),
    "suggested_answer" "jsonb"
);


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_messages" IS 'Stores messages within a conversation, with language context for message and feedback.';



COMMENT ON COLUMN "public"."conversation_messages"."message_language_code" IS 'Language of the message_text (user utterance or AI response).';



COMMENT ON COLUMN "public"."conversation_messages"."related_prompt_id" IS 'Links to the language-agnostic conversation starter concept.';



COMMENT ON COLUMN "public"."conversation_messages"."feedback_language_code" IS 'Language of the feedback_text, if different from message_language_code.';



CREATE SEQUENCE IF NOT EXISTS "public"."conversation_messages_message_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."conversation_messages_message_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."conversation_messages_message_id_seq" OWNED BY "public"."conversation_messages"."message_id";



CREATE TABLE IF NOT EXISTS "public"."conversation_prompt_status" (
    "prompt_status_id" bigint NOT NULL,
    "conversation_id" bigint NOT NULL,
    "prompt_id" integer NOT NULL,
    "first_addressed_message_id" bigint,
    "addressed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_prompt_status" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_prompt_status" IS 'Tracks addressed status of conversation starter concepts within a specific language-bound conversation attempt.';



COMMENT ON COLUMN "public"."conversation_prompt_status"."prompt_id" IS 'References the language-agnostic conversation starter concept.';



CREATE SEQUENCE IF NOT EXISTS "public"."conversation_prompt_status_prompt_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."conversation_prompt_status_prompt_status_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."conversation_prompt_status_prompt_status_id_seq" OWNED BY "public"."conversation_prompt_status"."prompt_status_id";



CREATE TABLE IF NOT EXISTS "public"."conversation_starter_translations" (
    "starter_translation_id" integer NOT NULL,
    "starter_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "starter_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_starter_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_starter_translations" IS 'Stores language-specific text for conversation starters.';



CREATE SEQUENCE IF NOT EXISTS "public"."conversation_starter_translations_starter_translation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."conversation_starter_translations_starter_translation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."conversation_starter_translations_starter_translation_id_seq" OWNED BY "public"."conversation_starter_translations"."starter_translation_id";



CREATE TABLE IF NOT EXISTS "public"."conversation_starters" (
    "id" integer NOT NULL,
    "lesson_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_starters" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_starters" IS 'Stores conversation starter concepts for lessons. Actual text is in conversation_starter_translations.';



CREATE SEQUENCE IF NOT EXISTS "public"."conversation_starters_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."conversation_starters_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."conversation_starters_id_seq" OWNED BY "public"."conversation_starters"."id";



CREATE TABLE IF NOT EXISTS "public"."dictation_attempts" (
    "attempt_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "lesson_id" integer NOT NULL,
    "phrase_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "attempt_number" integer NOT NULL,
    "reference_text" "text" NOT NULL,
    "written_text" "text" NOT NULL,
    "overall_similarity_score" numeric(5,2),
    "word_level_feedback" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dictation_attempts_overall_similarity_score_check" CHECK ((("overall_similarity_score" IS NULL) OR (("overall_similarity_score" >= (0)::numeric) AND ("overall_similarity_score" <= (100)::numeric))))
);


ALTER TABLE "public"."dictation_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."dictation_attempts" IS 'Logs detailed information for each dictation attempt by a student.';



COMMENT ON COLUMN "public"."dictation_attempts"."language_code" IS 'The language in which the dictation was performed.';



COMMENT ON COLUMN "public"."dictation_attempts"."reference_text" IS 'Snapshot of the target phrase text in the specific language at the time of the attempt.';



COMMENT ON COLUMN "public"."dictation_attempts"."word_level_feedback" IS 'Array of objects detailing word-level comparison, e.g., [{reference_word: "text", written_word: "txet", similarity_score: 75.00, position_in_phrase: 0}, ...].';



CREATE SEQUENCE IF NOT EXISTS "public"."dictation_attempts_attempt_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dictation_attempts_attempt_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dictation_attempts_attempt_id_seq" OWNED BY "public"."dictation_attempts"."attempt_id";



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "stripe_invoice_id" character varying(255) NOT NULL,
    "stripe_subscription_id" character varying(255),
    "stripe_customer_id" character varying(255),
    "status" "public"."invoice_status_enum" NOT NULL,
    "amount_due" integer NOT NULL,
    "amount_paid" integer NOT NULL,
    "amount_remaining" integer NOT NULL,
    "currency" character(3) NOT NULL,
    "due_date" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "invoice_pdf_url" "text",
    "hosted_invoice_url" "text",
    "billing_reason" "text",
    "metadata" "jsonb",
    "issued_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoices" IS 'Stores key information about Stripe invoices for billing history and support.';



CREATE SEQUENCE IF NOT EXISTS "public"."invoices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invoices_id_seq" OWNED BY "public"."invoices"."id";



CREATE TABLE IF NOT EXISTS "public"."language_levels" (
    "level_code" "public"."level_enum" NOT NULL,
    "level_name" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    "is_available" boolean DEFAULT false NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."language_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."languages" (
    "language_code" character varying(5) NOT NULL,
    "language_name" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_enabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."languages" OWNER TO "postgres";


COMMENT ON TABLE "public"."languages" IS 'Stores all supported languages for content and UI.';



COMMENT ON COLUMN "public"."languages"."language_code" IS 'BCP 47 language code, e.g., ''en'', ''es'', ''en-US''.';



COMMENT ON COLUMN "public"."languages"."language_name" IS 'Human-readable name of the language.';



CREATE TABLE IF NOT EXISTS "public"."learning_outcome_translations" (
    "outcome_translation_id" integer NOT NULL,
    "outcome_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "outcome_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "learning_outcome_translations_outcome_text_check" CHECK (("outcome_text" <> ''::"text"))
);


ALTER TABLE "public"."learning_outcome_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."learning_outcome_translations" IS 'Stores language-specific text for learning outcomes.';



CREATE SEQUENCE IF NOT EXISTS "public"."learning_outcome_translations_outcome_translation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."learning_outcome_translations_outcome_translation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."learning_outcome_translations_outcome_translation_id_seq" OWNED BY "public"."learning_outcome_translations"."outcome_translation_id";



CREATE TABLE IF NOT EXISTS "public"."learning_outcomes" (
    "outcome_id" integer NOT NULL,
    "lesson_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."learning_outcomes" OWNER TO "postgres";


COMMENT ON TABLE "public"."learning_outcomes" IS 'Defines learning outcomes for lessons. Actual outcome text is in learning_outcome_translations.';



CREATE SEQUENCE IF NOT EXISTS "public"."learning_outcomes_outcome_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."learning_outcomes_outcome_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."learning_outcomes_outcome_id_seq" OWNED BY "public"."learning_outcomes"."outcome_id";



CREATE TABLE IF NOT EXISTS "public"."lesson_chat_conversations" (
    "conversation_id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "lesson_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "all_prompts_addressed_at" timestamp with time zone,
    "last_message_at" timestamp with time zone
);


ALTER TABLE "public"."lesson_chat_conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."lesson_chat_conversations" IS 'Tracks each distinct conversation attempt for a lesson, specific to a language.';



COMMENT ON COLUMN "public"."lesson_chat_conversations"."language_code" IS 'The language in which this conversation took place.';



CREATE SEQUENCE IF NOT EXISTS "public"."lesson_chat_conversations_conversation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lesson_chat_conversations_conversation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lesson_chat_conversations_conversation_id_seq" OWNED BY "public"."lesson_chat_conversations"."conversation_id";



CREATE TABLE IF NOT EXISTS "public"."lesson_phrases" (
    "lesson_phrase_id" integer NOT NULL,
    "lesson_id" integer NOT NULL,
    "phrase_id" integer NOT NULL,
    "phrase_order" integer NOT NULL
);


ALTER TABLE "public"."lesson_phrases" OWNER TO "postgres";


ALTER TABLE "public"."lesson_phrases" ALTER COLUMN "lesson_phrase_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lesson_phrases_lesson_phrase_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lesson_translations" (
    "lesson_translation_id" integer NOT NULL,
    "lesson_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "lesson_title" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "grammar_focus" "text"[]
);


ALTER TABLE "public"."lesson_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."lesson_translations" IS 'Stores language-specific titles and grammar focus descriptions for lessons.';



CREATE SEQUENCE IF NOT EXISTS "public"."lesson_translations_lesson_translation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lesson_translations_lesson_translation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lesson_translations_lesson_translation_id_seq" OWNED BY "public"."lesson_translations"."lesson_translation_id";



CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "lesson_id" integer NOT NULL,
    "unit_id" integer NOT NULL,
    "lesson_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_dictation" boolean DEFAULT true NOT NULL,
    "has_pronunciation" boolean DEFAULT true NOT NULL,
    "has_chat" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


COMMENT ON TABLE "public"."lessons" IS 'Main lessons table. Title is in lesson_translations.';



CREATE SEQUENCE IF NOT EXISTS "public"."lessons_lesson_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lessons_lesson_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lessons_lesson_id_seq" OWNED BY "public"."lessons"."lesson_id";



CREATE TABLE IF NOT EXISTS "public"."partnership_invitations" (
    "id" bigint NOT NULL,
    "partnership_id" bigint NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "intended_for_email" "text" NOT NULL,
    "redeemed_by_profile_id" "uuid",
    "redeemed_at" timestamp with time zone,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."partnership_invitation_status" DEFAULT 'pending'::"public"."partnership_invitation_status" NOT NULL
);


ALTER TABLE "public"."partnership_invitations" OWNER TO "postgres";


ALTER TABLE "public"."partnership_invitations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."partnership_invitations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."partnerships" (
    "id" bigint NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "trial_duration_days" integer DEFAULT 7 NOT NULL,
    "trial_tier" "public"."subscription_tier_enum" DEFAULT 'pro'::"public"."subscription_tier_enum" NOT NULL,
    "discount_percentage" numeric DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "partnerships_discount_percentage_check" CHECK ((("discount_percentage" >= (0)::numeric) AND ("discount_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."partnerships" OWNER TO "postgres";


ALTER TABLE "public"."partnerships" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."partnerships_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."phrase_versions" (
    "phrase_version_id" integer NOT NULL,
    "phrase_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "phrase_text" "text" NOT NULL,
    "audio_url_normal" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "audio_url_slow" character varying(255)
);


ALTER TABLE "public"."phrase_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."phrase_versions" IS 'Stores language-specific text and audio for vocabulary phrases.';



COMMENT ON COLUMN "public"."phrase_versions"."audio_url_normal" IS 'S3 key for the normal speed audio pronunciation.';



COMMENT ON COLUMN "public"."phrase_versions"."audio_url_slow" IS 'S3 key for the slow speed audio pronunciation.';



CREATE SEQUENCE IF NOT EXISTS "public"."phrase_versions_phrase_version_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."phrase_versions_phrase_version_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."phrase_versions_phrase_version_id_seq" OWNED BY "public"."phrase_versions"."phrase_version_id";



CREATE TABLE IF NOT EXISTS "public"."phrases" (
    "phrase_id" integer NOT NULL,
    "concept_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."phrases" OWNER TO "postgres";


ALTER TABLE "public"."phrases" ALTER COLUMN "phrase_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."phrases_phrase_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."prices" (
    "id" integer NOT NULL,
    "stripe_price_id" character varying(255) NOT NULL,
    "product_id" integer NOT NULL,
    "active" boolean DEFAULT true,
    "unit_amount" integer,
    "currency" character(3) NOT NULL,
    "type" "public"."price_type_enum" NOT NULL,
    "billing_interval" "public"."price_billing_interval_enum",
    "interval_count" integer,
    "description" "text",
    "trial_period_days" integer,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prices" OWNER TO "postgres";


COMMENT ON TABLE "public"."prices" IS 'Defines specific prices for products, including currency, amount, and billing interval.';



COMMENT ON COLUMN "public"."prices"."unit_amount" IS 'Price in the smallest currency unit (e.g., cents for USD).';



COMMENT ON COLUMN "public"."prices"."trial_period_days" IS 'Number of trial days offered by Stripe for this specific price, if applicable.';



CREATE SEQUENCE IF NOT EXISTS "public"."prices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."prices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."prices_id_seq" OWNED BY "public"."prices"."id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" integer NOT NULL,
    "stripe_product_id" character varying(255) NOT NULL,
    "active" boolean DEFAULT true,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "tier_key" "public"."subscription_tier_enum",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" integer,
    "product_type" character varying DEFAULT 'subscription'::character varying
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Represents the core subscription products/tiers offered (e.g., Standard, Premium).';



COMMENT ON COLUMN "public"."products"."tier_key" IS 'Optionally links this product to an internal subscription_tier_enum.';



CREATE SEQUENCE IF NOT EXISTS "public"."products_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."products_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."products_id_seq" OWNED BY "public"."products"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" character varying(255),
    "last_name" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "public"."user_role_enum" DEFAULT 'student'::"public"."user_role_enum" NOT NULL,
    "partnership_id" bigint
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Stores application-specific common profile information for users, extending auth.users. Email and primary auth phone are managed in auth.users.';



CREATE TABLE IF NOT EXISTS "public"."speech_attempts" (
    "attempt_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "lesson_id" integer NOT NULL,
    "phrase_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "attempt_number" integer NOT NULL,
    "reference_text" "text" NOT NULL,
    "recognized_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accuracy_score" numeric(5,2),
    "fluency_score" numeric(5,2),
    "completeness_score" numeric(5,2),
    "pronunciation_score" numeric(5,2),
    "prosody_score" numeric(5,2),
    "phonetic_data" "jsonb",
    CONSTRAINT "speech_attempts_accuracy_score_check" CHECK ((("accuracy_score" >= (0)::numeric) AND ("accuracy_score" <= (100)::numeric))),
    CONSTRAINT "speech_attempts_completeness_score_check" CHECK ((("completeness_score" >= (0)::numeric) AND ("completeness_score" <= (100)::numeric))),
    CONSTRAINT "speech_attempts_fluency_score_check" CHECK ((("fluency_score" >= (0)::numeric) AND ("fluency_score" <= (100)::numeric))),
    CONSTRAINT "speech_attempts_pronunciation_score_check" CHECK ((("pronunciation_score" >= (0)::numeric) AND ("pronunciation_score" <= (100)::numeric))),
    CONSTRAINT "speech_attempts_prosody_score_check" CHECK ((("prosody_score" >= (0)::numeric) AND ("prosody_score" <= (100)::numeric)))
);


ALTER TABLE "public"."speech_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."speech_attempts" IS 'Stores records of student speech attempts for specific phrases and languages.';



COMMENT ON COLUMN "public"."speech_attempts"."phrase_id" IS 'References the language-agnostic phrase concept in vocabulary_phrases.';



COMMENT ON COLUMN "public"."speech_attempts"."language_code" IS 'The language of the phrase version (from phrase_versions) that was attempted.';



COMMENT ON COLUMN "public"."speech_attempts"."reference_text" IS 'The canonical text of the phrase in the attempted language, sourced from phrase_versions.';



CREATE SEQUENCE IF NOT EXISTS "public"."speech_attempts_attempt_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."speech_attempts_attempt_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."speech_attempts_attempt_id_seq" OWNED BY "public"."speech_attempts"."attempt_id";



CREATE TABLE IF NOT EXISTS "public"."student_profiles" (
    "profile_id" "uuid" NOT NULL,
    "discount" numeric(5,2),
    "status" "public"."account_status_enum" NOT NULL,
    "current_streak_days" integer DEFAULT 0 NOT NULL,
    "last_streak_date" "date",
    "subscription_tier" "public"."subscription_tier_enum" DEFAULT 'free'::"public"."subscription_tier_enum" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "native_language_code" character varying(5),
    "current_target_language_code" character varying(5),
    "stripe_customer_id" character varying(255),
    "default_payment_method_details" "jsonb",
    "billing_address" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "partnership_id" bigint,
    "selected_level_code" "public"."level_enum",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "student_profiles_points_check" CHECK (("points" >= 0))
);


ALTER TABLE "public"."student_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."student_profiles" IS 'Stores student-specific academic progress, subscription details, and payment information, extending a user''s general profile from public.profiles.';



COMMENT ON COLUMN "public"."student_profiles"."profile_id" IS 'The unique identifier for this student profile, referencing the primary key (id) of the corresponding user in public.profiles.';



COMMENT ON COLUMN "public"."student_profiles"."discount" IS 'Any applicable discount percentage for the student''s subscription (e.g., 10.00 for 10% discount). NULL if no discount applies.';



COMMENT ON COLUMN "public"."student_profiles"."status" IS 'Overall status of the student profile on the platform (e.g., active, suspended, pending_verification, deactivated). Uses the public.account_status_enum type.';



COMMENT ON COLUMN "public"."student_profiles"."current_streak_days" IS 'Number of consecutive days the student has maintained an activity streak (e.g., lesson completion, practice).';



COMMENT ON COLUMN "public"."student_profiles"."last_streak_date" IS 'The most recent date on which the student successfully contributed to their current activity streak.';



COMMENT ON COLUMN "public"."student_profiles"."subscription_tier" IS 'The current subscription tier of the student (e.g., free, standard, pro). Uses the public.subscription_tier_enum type.';



COMMENT ON COLUMN "public"."student_profiles"."points" IS 'Gamification points or rewards earned by the student within the platform.';



COMMENT ON COLUMN "public"."student_profiles"."native_language_code" IS 'The student''s declared native language, referencing language_code in the public.languages table.';



COMMENT ON COLUMN "public"."student_profiles"."current_target_language_code" IS 'The language the student is currently actively learning or using as a target, referencing language_code in the public.languages table.';



COMMENT ON COLUMN "public"."student_profiles"."stripe_customer_id" IS 'The Stripe Customer ID associated with this student. Typically created when the student initiates their first payment or subscription with Stripe.';



COMMENT ON COLUMN "public"."student_profiles"."default_payment_method_details" IS 'Non-sensitive, displayable details of the student''s default payment method, usually sourced from Stripe (e.g., card brand, last four digits, expiry). For display purposes only.';



COMMENT ON COLUMN "public"."student_profiles"."billing_address" IS 'The billing address associated with the student''s payment methods, often collected by Stripe and can be stored here for reference, display, or local analytics.';



COMMENT ON COLUMN "public"."student_profiles"."created_at" IS 'Timestamp indicating when this student profile record was created.';



COMMENT ON COLUMN "public"."student_profiles"."updated_at" IS 'Timestamp indicating when this student profile record was last updated.';



COMMENT ON COLUMN "public"."student_profiles"."selected_level_code" IS 'User manually selected level preference for learning content';



CREATE TABLE IF NOT EXISTS "public"."student_subscriptions" (
    "id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "price_id" integer NOT NULL,
    "stripe_subscription_id" character varying(255) NOT NULL,
    "status" "public"."subscription_status_enum" NOT NULL,
    "quantity" integer DEFAULT 1,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "trial_start_at" timestamp with time zone,
    "trial_end_at" timestamp with time zone,
    "metadata" "jsonb",
    "stripe_created_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."student_subscriptions" IS 'Tracks individual student subscriptions to specific prices/plans.';



COMMENT ON COLUMN "public"."student_subscriptions"."price_id" IS 'The specific price (monthly/yearly/etc.) the student is subscribed to.';



CREATE SEQUENCE IF NOT EXISTS "public"."student_subscriptions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."student_subscriptions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."student_subscriptions_id_seq" OWNED BY "public"."student_subscriptions"."id";



CREATE TABLE IF NOT EXISTS "public"."student_target_languages" (
    "profile_id" "uuid" NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_target_languages" OWNER TO "postgres";


COMMENT ON TABLE "public"."student_target_languages" IS 'Stores all languages a student intends to learn or has learned.';



CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages" (
    "message_id" bigint NOT NULL,
    "ticket_id" bigint NOT NULL,
    "sender_profile_id" "uuid" NOT NULL,
    "message_text" "text" NOT NULL,
    "attachment_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_ticket_messages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."support_ticket_messages_message_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."support_ticket_messages_message_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."support_ticket_messages_message_id_seq" OWNED BY "public"."support_ticket_messages"."message_id";



CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "ticket_id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "assigned_to_profile_id" "uuid",
    "status" "public"."ticket_status_enum" DEFAULT 'open'::"public"."ticket_status_enum" NOT NULL,
    "reason" "public"."contact_reason_enum" NOT NULL,
    "subject" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "last_message_at" timestamp with time zone,
    CONSTRAINT "support_tickets_subject_check" CHECK (("subject" <> ''::"text"))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."support_tickets_ticket_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."support_tickets_ticket_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."support_tickets_ticket_id_seq" OWNED BY "public"."support_tickets"."ticket_id";



CREATE TABLE IF NOT EXISTS "public"."tour_steps" (
    "step_id" integer NOT NULL,
    "tour_id" integer NOT NULL,
    "step_order" integer NOT NULL,
    "page_route" "text" NOT NULL,
    "target_selector" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "tour_props" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "media_url" "text"
);


ALTER TABLE "public"."tour_steps" OWNER TO "postgres";


ALTER TABLE "public"."tour_steps" ALTER COLUMN "step_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."tour_steps_step_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tours" (
    "tour_id" integer NOT NULL,
    "tour_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tours" OWNER TO "postgres";


ALTER TABLE "public"."tours" ALTER COLUMN "tour_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."tours_tour_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."unit_translations" (
    "unit_translation_id" integer NOT NULL,
    "unit_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "unit_title" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."unit_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."unit_translations" IS 'Stores language-specific titles and descriptions for units.';



CREATE SEQUENCE IF NOT EXISTS "public"."unit_translations_unit_translation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."unit_translations_unit_translation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."unit_translations_unit_translation_id_seq" OWNED BY "public"."unit_translations"."unit_translation_id";



CREATE TABLE IF NOT EXISTS "public"."units" (
    "unit_id" integer NOT NULL,
    "level" "public"."level_enum" NOT NULL,
    "unit_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."units" OWNER TO "postgres";


COMMENT ON TABLE "public"."units" IS 'Groups lessons by level and defines their order. Title and description are in unit_translations.';



CREATE SEQUENCE IF NOT EXISTS "public"."units_unit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."units_unit_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."units_unit_id_seq" OWNED BY "public"."units"."unit_id";



CREATE TABLE IF NOT EXISTS "public"."user_audiobook_chapter_progress" (
    "id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "book_id" integer NOT NULL,
    "chapter_id" integer NOT NULL,
    "current_position_seconds" numeric DEFAULT 0,
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "last_listened_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_audiobook_chapter_progress" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_audiobook_chapter_progress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_audiobook_chapter_progress_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_audiobook_chapter_progress_id_seq" OWNED BY "public"."user_audiobook_chapter_progress"."id";



CREATE TABLE IF NOT EXISTS "public"."user_audiobook_progress" (
    "progress_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "book_id" integer NOT NULL,
    "current_chapter_id" integer,
    "current_position_seconds" numeric DEFAULT 0,
    "last_read_at" timestamp with time zone DEFAULT "now"(),
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "total_chapters" integer DEFAULT 0,
    "completed_chapters" integer DEFAULT 0,
    "completion_percentage" numeric DEFAULT 0
);


ALTER TABLE "public"."user_audiobook_progress" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_audiobook_progress_progress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_audiobook_progress_progress_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_audiobook_progress_progress_id_seq" OWNED BY "public"."user_audiobook_progress"."progress_id";



CREATE TABLE IF NOT EXISTS "public"."user_audiobook_purchases" (
    "purchase_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "book_id" integer NOT NULL,
    "purchase_type" "public"."purchase_type_enum" NOT NULL,
    "points_spent" integer DEFAULT 0,
    "amount_paid_cents" integer DEFAULT 0,
    "purchased_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_audiobook_purchases" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_audiobook_purchases_purchase_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_audiobook_purchases_purchase_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_audiobook_purchases_purchase_id_seq" OWNED BY "public"."user_audiobook_purchases"."purchase_id";



CREATE TABLE IF NOT EXISTS "public"."user_lesson_activity_progress" (
    "activity_progress_id" bigint NOT NULL,
    "user_lesson_progress_id" integer NOT NULL,
    "activity_type" "public"."activity_type_enum" NOT NULL,
    "status" "public"."activity_status_enum" DEFAULT 'not_started'::"public"."activity_status_enum" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."user_lesson_activity_progress" OWNER TO "postgres";


ALTER TABLE "public"."user_lesson_activity_progress" ALTER COLUMN "activity_progress_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_lesson_activity_progress_activity_progress_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_lesson_progress" (
    "progress_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "lesson_id" integer NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "last_progress_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_lesson_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_lesson_progress" IS 'Tracks student progress at the lesson level.';



COMMENT ON COLUMN "public"."user_lesson_progress"."profile_id" IS 'References the student profile ID.';



CREATE SEQUENCE IF NOT EXISTS "public"."user_lesson_progress_progress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_lesson_progress_progress_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_lesson_progress_progress_id_seq" OWNED BY "public"."user_lesson_progress"."progress_id";



CREATE TABLE IF NOT EXISTS "public"."user_level_completion" (
    "profile_id" "uuid" NOT NULL,
    "level_code" "public"."level_enum" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_level_completion" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_level_completion" IS 'Tracks completed levels for each user to enable efficient level progression authorization';



CREATE TABLE IF NOT EXISTS "public"."user_phrase_progress" (
    "phrase_progress_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "lesson_id" integer NOT NULL,
    "phrase_id" integer NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "pronunciation_completed" boolean DEFAULT false,
    "pronunciation_attempts" integer DEFAULT 0,
    "pronunciation_last_attempt_at" timestamp with time zone,
    "dictation_completed" boolean DEFAULT false,
    "dictation_attempts" integer DEFAULT 0,
    "dictation_last_attempt_at" timestamp with time zone,
    "last_progress_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_phrase_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_phrase_progress" IS 'Tracks student summary progress across different activity types for a single phrase, specific to a language.';



COMMENT ON COLUMN "public"."user_phrase_progress"."profile_id" IS 'References the student profile ID.';



COMMENT ON COLUMN "public"."user_phrase_progress"."language_code" IS 'The language in which the student is progressing with this specific phrase concept.';



COMMENT ON COLUMN "public"."user_phrase_progress"."pronunciation_completed" IS 'True if the student has successfully completed the pronunciation activity for this phrase in this language.';



COMMENT ON COLUMN "public"."user_phrase_progress"."last_progress_at" IS 'Timestamp of the last update to any progress field for this phrase/language combination.';



CREATE SEQUENCE IF NOT EXISTS "public"."user_phrase_progress_phrase_progress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_phrase_progress_phrase_progress_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_phrase_progress_phrase_progress_id_seq" OWNED BY "public"."user_phrase_progress"."phrase_progress_id";



CREATE TABLE IF NOT EXISTS "public"."user_points_log" (
    "log_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "points_awarded" integer NOT NULL,
    "reason_code" character varying(50) NOT NULL,
    "related_lesson_id" integer,
    "related_phrase_id" integer,
    "related_word_text" character varying(100),
    "related_word_language_code" character varying(5),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "activity_type" "public"."activity_type_enum"
);


ALTER TABLE "public"."user_points_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_points_log" IS 'Logs points awarded or spent by students, with language context for word-related points.';



COMMENT ON COLUMN "public"."user_points_log"."related_phrase_id" IS 'References the language-agnostic phrase concept, if applicable.';



COMMENT ON COLUMN "public"."user_points_log"."related_word_language_code" IS 'Language of related_word_text, if applicable.';



CREATE SEQUENCE IF NOT EXISTS "public"."user_points_log_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_points_log_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_points_log_log_id_seq" OWNED BY "public"."user_points_log"."log_id";



CREATE TABLE IF NOT EXISTS "public"."user_srs_data" (
    "user_srs_data_id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "phrase_id" integer NOT NULL,
    "language_code" character varying NOT NULL,
    "due_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interval" real DEFAULT 0 NOT NULL,
    "ease_factor" real DEFAULT 2.5 NOT NULL,
    "repetitions" integer DEFAULT 0 NOT NULL,
    "last_reviewed_at" timestamp with time zone
);


ALTER TABLE "public"."user_srs_data" OWNER TO "postgres";


ALTER TABLE "public"."user_srs_data" ALTER COLUMN "user_srs_data_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_srs_data_user_srs_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_tour_progress" (
    "profile_id" "uuid" NOT NULL,
    "tour_id" integer NOT NULL,
    "status" "public"."tour_progress_status" DEFAULT 'pending'::"public"."tour_progress_status" NOT NULL,
    "last_completed_step" integer DEFAULT 0 NOT NULL,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_tour_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_word_pronunciation" (
    "id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "word_text" character varying(100) NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "total_attempts" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "sum_accuracy_score" numeric DEFAULT 0,
    "average_accuracy_score" numeric(5,2) DEFAULT 0,
    "last_accuracy_score" numeric(5,2),
    "last_error_type" character varying(50),
    "last_attempt_at" timestamp with time zone,
    "needs_practice" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_word_pronunciation" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_word_pronunciation" IS 'Tracks student''s pronunciation performance for individual words in specific languages.';



COMMENT ON COLUMN "public"."user_word_pronunciation"."profile_id" IS 'References the student profile ID.';



COMMENT ON COLUMN "public"."user_word_pronunciation"."language_code" IS 'The language of the word_text being tracked.';



CREATE SEQUENCE IF NOT EXISTS "public"."user_word_pronunciation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_word_pronunciation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_word_pronunciation_id_seq" OWNED BY "public"."user_word_pronunciation"."id";



CREATE TABLE IF NOT EXISTS "public"."user_word_spelling" (
    "id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "word_text" character varying(100) NOT NULL,
    "language_code" character varying(5) NOT NULL,
    "total_dictation_occurrences" integer DEFAULT 0,
    "dictation_error_count" integer DEFAULT 0,
    "sum_word_similarity_score" numeric DEFAULT 0,
    "average_word_similarity_score" numeric(5,2) DEFAULT 0,
    "last_word_similarity_score" numeric(5,2),
    "last_dictation_attempt_at" timestamp with time zone,
    "needs_spelling_practice" boolean DEFAULT false,
    "last_reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_word_spelling_last_word_similarity_score_check" CHECK ((("last_word_similarity_score" IS NULL) OR (("last_word_similarity_score" >= (0)::numeric) AND ("last_word_similarity_score" <= (100)::numeric))))
);


ALTER TABLE "public"."user_word_spelling" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_word_spelling" IS 'Tracks student spelling performance for individual words in specific languages, primarily from dictation activities.';



COMMENT ON COLUMN "public"."user_word_spelling"."language_code" IS 'The language of the word_text being tracked for spelling.';



COMMENT ON COLUMN "public"."user_word_spelling"."dictation_error_count" IS 'Times this word was marked as incorrect in dictation, potentially based on a similarity score threshold.';



CREATE SEQUENCE IF NOT EXISTS "public"."user_word_spelling_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_word_spelling_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_word_spelling_id_seq" OWNED BY "public"."user_word_spelling"."id";



ALTER TABLE ONLY "public"."audiobook_alignment" ALTER COLUMN "alignment_id" SET DEFAULT "nextval"('"public"."audiobook_alignment_alignment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audiobook_chapters" ALTER COLUMN "chapter_id" SET DEFAULT "nextval"('"public"."audiobook_chapters_chapter_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audiobooks" ALTER COLUMN "book_id" SET DEFAULT "nextval"('"public"."audiobooks_book_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."conversation_messages" ALTER COLUMN "message_id" SET DEFAULT "nextval"('"public"."conversation_messages_message_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."conversation_prompt_status" ALTER COLUMN "prompt_status_id" SET DEFAULT "nextval"('"public"."conversation_prompt_status_prompt_status_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."conversation_starter_translations" ALTER COLUMN "starter_translation_id" SET DEFAULT "nextval"('"public"."conversation_starter_translations_starter_translation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."conversation_starters" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."conversation_starters_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dictation_attempts" ALTER COLUMN "attempt_id" SET DEFAULT "nextval"('"public"."dictation_attempts_attempt_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."invoices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invoices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."learning_outcome_translations" ALTER COLUMN "outcome_translation_id" SET DEFAULT "nextval"('"public"."learning_outcome_translations_outcome_translation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."learning_outcomes" ALTER COLUMN "outcome_id" SET DEFAULT "nextval"('"public"."learning_outcomes_outcome_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lesson_chat_conversations" ALTER COLUMN "conversation_id" SET DEFAULT "nextval"('"public"."lesson_chat_conversations_conversation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lesson_translations" ALTER COLUMN "lesson_translation_id" SET DEFAULT "nextval"('"public"."lesson_translations_lesson_translation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lessons" ALTER COLUMN "lesson_id" SET DEFAULT "nextval"('"public"."lessons_lesson_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."phrase_versions" ALTER COLUMN "phrase_version_id" SET DEFAULT "nextval"('"public"."phrase_versions_phrase_version_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."prices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."prices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."speech_attempts" ALTER COLUMN "attempt_id" SET DEFAULT "nextval"('"public"."speech_attempts_attempt_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."student_subscriptions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."student_subscriptions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."support_ticket_messages" ALTER COLUMN "message_id" SET DEFAULT "nextval"('"public"."support_ticket_messages_message_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."support_tickets" ALTER COLUMN "ticket_id" SET DEFAULT "nextval"('"public"."support_tickets_ticket_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."unit_translations" ALTER COLUMN "unit_translation_id" SET DEFAULT "nextval"('"public"."unit_translations_unit_translation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."units" ALTER COLUMN "unit_id" SET DEFAULT "nextval"('"public"."units_unit_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_audiobook_chapter_progress" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_audiobook_chapter_progress_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_audiobook_progress" ALTER COLUMN "progress_id" SET DEFAULT "nextval"('"public"."user_audiobook_progress_progress_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_audiobook_purchases" ALTER COLUMN "purchase_id" SET DEFAULT "nextval"('"public"."user_audiobook_purchases_purchase_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_lesson_progress" ALTER COLUMN "progress_id" SET DEFAULT "nextval"('"public"."user_lesson_progress_progress_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_phrase_progress" ALTER COLUMN "phrase_progress_id" SET DEFAULT "nextval"('"public"."user_phrase_progress_phrase_progress_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_points_log" ALTER COLUMN "log_id" SET DEFAULT "nextval"('"public"."user_points_log_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_word_pronunciation" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_word_pronunciation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_word_spelling" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_word_spelling_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audiobook_alignment"
    ADD CONSTRAINT "audiobook_alignment_chapter_unique" UNIQUE ("book_id", "chapter_id");



ALTER TABLE ONLY "public"."audiobook_alignment"
    ADD CONSTRAINT "audiobook_alignment_pkey" PRIMARY KEY ("alignment_id");



ALTER TABLE ONLY "public"."audiobook_chapters"
    ADD CONSTRAINT "audiobook_chapters_order_unique" UNIQUE ("book_id", "chapter_order");



ALTER TABLE ONLY "public"."audiobook_chapters"
    ADD CONSTRAINT "audiobook_chapters_pkey" PRIMARY KEY ("chapter_id");



ALTER TABLE ONLY "public"."audiobooks"
    ADD CONSTRAINT "audiobooks_pkey" PRIMARY KEY ("book_id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_message_order_key" UNIQUE ("conversation_id", "message_order");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."conversation_prompt_status"
    ADD CONSTRAINT "conversation_prompt_status_conversation_id_prompt_id_key" UNIQUE ("conversation_id", "prompt_id");



ALTER TABLE ONLY "public"."conversation_prompt_status"
    ADD CONSTRAINT "conversation_prompt_status_pkey" PRIMARY KEY ("prompt_status_id");



ALTER TABLE ONLY "public"."conversation_starter_translations"
    ADD CONSTRAINT "conversation_starter_translations_pkey" PRIMARY KEY ("starter_translation_id");



ALTER TABLE ONLY "public"."conversation_starter_translations"
    ADD CONSTRAINT "conversation_starter_translations_starter_id_language_code_key" UNIQUE ("starter_id", "language_code");



ALTER TABLE ONLY "public"."conversation_starters"
    ADD CONSTRAINT "conversation_starters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dictation_attempts"
    ADD CONSTRAINT "dictation_attempts_pkey" PRIMARY KEY ("attempt_id");



ALTER TABLE ONLY "public"."dictation_attempts"
    ADD CONSTRAINT "dictation_attempts_profile_id_lesson_id_phrase_id_language__key" UNIQUE ("profile_id", "lesson_id", "phrase_id", "language_code", "attempt_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_stripe_invoice_id_key" UNIQUE ("stripe_invoice_id");



ALTER TABLE ONLY "public"."language_levels"
    ADD CONSTRAINT "language_levels_pkey" PRIMARY KEY ("level_code");



ALTER TABLE ONLY "public"."language_levels"
    ADD CONSTRAINT "language_levels_sort_order_key" UNIQUE ("sort_order");



ALTER TABLE ONLY "public"."languages"
    ADD CONSTRAINT "languages_language_name_key" UNIQUE ("language_name");



ALTER TABLE ONLY "public"."languages"
    ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("language_code");



ALTER TABLE ONLY "public"."learning_outcome_translations"
    ADD CONSTRAINT "learning_outcome_translations_outcome_id_language_code_key" UNIQUE ("outcome_id", "language_code");



ALTER TABLE ONLY "public"."learning_outcome_translations"
    ADD CONSTRAINT "learning_outcome_translations_pkey" PRIMARY KEY ("outcome_translation_id");



ALTER TABLE ONLY "public"."learning_outcomes"
    ADD CONSTRAINT "learning_outcomes_pkey" PRIMARY KEY ("outcome_id");



ALTER TABLE ONLY "public"."lesson_chat_conversations"
    ADD CONSTRAINT "lesson_chat_conversations_pkey" PRIMARY KEY ("conversation_id");



ALTER TABLE ONLY "public"."lesson_phrases"
    ADD CONSTRAINT "lesson_phrases_pkey" PRIMARY KEY ("lesson_phrase_id");



ALTER TABLE ONLY "public"."lesson_translations"
    ADD CONSTRAINT "lesson_translations_lesson_id_language_code_key" UNIQUE ("lesson_id", "language_code");



ALTER TABLE ONLY "public"."lesson_translations"
    ADD CONSTRAINT "lesson_translations_pkey" PRIMARY KEY ("lesson_translation_id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("lesson_id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_unit_id_lesson_order_key" UNIQUE ("unit_id", "lesson_order");



ALTER TABLE ONLY "public"."partnership_invitations"
    ADD CONSTRAINT "partnership_invitations_code_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."partnership_invitations"
    ADD CONSTRAINT "partnership_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partnership_invitations"
    ADD CONSTRAINT "partnership_invitations_redeemed_by_profile_id_key" UNIQUE ("redeemed_by_profile_id");



ALTER TABLE ONLY "public"."partnerships"
    ADD CONSTRAINT "partnerships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phrase_versions"
    ADD CONSTRAINT "phrase_versions_phrase_id_language_code_key" UNIQUE ("phrase_id", "language_code");



ALTER TABLE ONLY "public"."phrase_versions"
    ADD CONSTRAINT "phrase_versions_pkey" PRIMARY KEY ("phrase_version_id");



ALTER TABLE ONLY "public"."phrases"
    ADD CONSTRAINT "phrases_pkey" PRIMARY KEY ("phrase_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_stripe_price_id_key" UNIQUE ("stripe_price_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_stripe_product_id_key" UNIQUE ("stripe_product_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."speech_attempts"
    ADD CONSTRAINT "speech_attempts_pkey" PRIMARY KEY ("attempt_id");



ALTER TABLE ONLY "public"."speech_attempts"
    ADD CONSTRAINT "speech_attempts_profile_lesson_phrase_lang_attempt_key" UNIQUE ("profile_id", "lesson_id", "phrase_id", "language_code", "attempt_number");



ALTER TABLE ONLY "public"."student_profiles"
    ADD CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."student_profiles"
    ADD CONSTRAINT "student_profiles_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."student_subscriptions"
    ADD CONSTRAINT "student_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_subscriptions"
    ADD CONSTRAINT "student_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."student_target_languages"
    ADD CONSTRAINT "student_target_languages_pkey" PRIMARY KEY ("profile_id", "language_code");



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("ticket_id");



ALTER TABLE ONLY "public"."tour_steps"
    ADD CONSTRAINT "tour_steps_pkey" PRIMARY KEY ("step_id");



ALTER TABLE ONLY "public"."tour_steps"
    ADD CONSTRAINT "tour_steps_tour_id_step_order_key" UNIQUE ("tour_id", "step_order");



ALTER TABLE ONLY "public"."tours"
    ADD CONSTRAINT "tours_pkey" PRIMARY KEY ("tour_id");



ALTER TABLE ONLY "public"."tours"
    ADD CONSTRAINT "tours_tour_key_key" UNIQUE ("tour_key");



ALTER TABLE ONLY "public"."lesson_phrases"
    ADD CONSTRAINT "unique_phrase_in_lesson" UNIQUE ("lesson_id", "phrase_id");



ALTER TABLE ONLY "public"."phrase_versions"
    ADD CONSTRAINT "unique_text_per_language" UNIQUE ("language_code", "phrase_text");



ALTER TABLE ONLY "public"."user_srs_data"
    ADD CONSTRAINT "unique_user_phrase_language_srs" UNIQUE ("profile_id", "phrase_id", "language_code");



ALTER TABLE ONLY "public"."unit_translations"
    ADD CONSTRAINT "unit_translations_pkey" PRIMARY KEY ("unit_translation_id");



ALTER TABLE ONLY "public"."unit_translations"
    ADD CONSTRAINT "unit_translations_unit_id_language_code_key" UNIQUE ("unit_id", "language_code");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_level_unit_order_key" UNIQUE ("level", "unit_order");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("unit_id");



ALTER TABLE ONLY "public"."user_audiobook_chapter_progress"
    ADD CONSTRAINT "user_audiobook_chapter_progre_profile_id_book_id_chapter_id_key" UNIQUE ("profile_id", "book_id", "chapter_id");



ALTER TABLE ONLY "public"."user_audiobook_chapter_progress"
    ADD CONSTRAINT "user_audiobook_chapter_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_audiobook_progress"
    ADD CONSTRAINT "user_audiobook_progress_pkey" PRIMARY KEY ("progress_id");



ALTER TABLE ONLY "public"."user_audiobook_progress"
    ADD CONSTRAINT "user_audiobook_progress_unique" UNIQUE ("profile_id", "book_id");



ALTER TABLE ONLY "public"."user_audiobook_purchases"
    ADD CONSTRAINT "user_audiobook_purchases_pkey" PRIMARY KEY ("purchase_id");



ALTER TABLE ONLY "public"."user_audiobook_purchases"
    ADD CONSTRAINT "user_audiobook_purchases_unique" UNIQUE ("profile_id", "book_id");



ALTER TABLE ONLY "public"."user_lesson_activity_progress"
    ADD CONSTRAINT "user_lesson_activity_progress_pkey" PRIMARY KEY ("activity_progress_id");



ALTER TABLE ONLY "public"."user_lesson_activity_progress"
    ADD CONSTRAINT "user_lesson_activity_progress_user_lesson_progress_id_activ_key" UNIQUE ("user_lesson_progress_id", "activity_type");



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("progress_id");



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_profile_id_lesson_id_key" UNIQUE ("profile_id", "lesson_id");



ALTER TABLE ONLY "public"."user_level_completion"
    ADD CONSTRAINT "user_level_completion_pkey" PRIMARY KEY ("profile_id", "level_code");



ALTER TABLE ONLY "public"."user_phrase_progress"
    ADD CONSTRAINT "user_phrase_progress_pkey" PRIMARY KEY ("phrase_progress_id");



ALTER TABLE ONLY "public"."user_phrase_progress"
    ADD CONSTRAINT "user_phrase_progress_profile_id_lesson_id_phrase_id_languag_key" UNIQUE ("profile_id", "lesson_id", "phrase_id", "language_code");



ALTER TABLE ONLY "public"."user_points_log"
    ADD CONSTRAINT "user_points_log_pkey" PRIMARY KEY ("log_id");



ALTER TABLE ONLY "public"."user_srs_data"
    ADD CONSTRAINT "user_srs_data_pkey" PRIMARY KEY ("user_srs_data_id");



ALTER TABLE ONLY "public"."user_tour_progress"
    ADD CONSTRAINT "user_tour_progress_pkey" PRIMARY KEY ("profile_id", "tour_id");



ALTER TABLE ONLY "public"."user_word_pronunciation"
    ADD CONSTRAINT "user_word_pronunciation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_word_pronunciation"
    ADD CONSTRAINT "user_word_pronunciation_profile_id_word_text_language_code_key" UNIQUE ("profile_id", "word_text", "language_code");



ALTER TABLE ONLY "public"."user_word_pronunciation"
    ADD CONSTRAINT "user_word_pronunciation_unique_profile_word_lang" UNIQUE ("profile_id", "word_text", "language_code");



ALTER TABLE ONLY "public"."user_word_spelling"
    ADD CONSTRAINT "user_word_spelling_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_word_spelling"
    ADD CONSTRAINT "user_word_spelling_profile_id_word_text_language_code_key" UNIQUE ("profile_id", "word_text", "language_code");



CREATE INDEX "idx_audiobook_chapters_book_id" ON "public"."audiobook_chapters" USING "btree" ("book_id");



CREATE INDEX "idx_conversation_messages_conversation" ON "public"."conversation_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_messages_prompt" ON "public"."conversation_messages" USING "btree" ("related_prompt_id");



CREATE INDEX "idx_conversation_prompt_status_convo_prompt" ON "public"."conversation_prompt_status" USING "btree" ("conversation_id", "prompt_id");



CREATE INDEX "idx_invoices_profile_id" ON "public"."invoices" USING "btree" ("profile_id");



CREATE INDEX "idx_invoices_stripe_invoice_id" ON "public"."invoices" USING "btree" ("stripe_invoice_id");



CREATE INDEX "idx_invoices_stripe_subscription_id" ON "public"."invoices" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_lesson_chat_conversations_profile_lesson_lang" ON "public"."lesson_chat_conversations" USING "btree" ("profile_id", "lesson_id", "language_code");



CREATE INDEX "idx_prices_product_id" ON "public"."prices" USING "btree" ("product_id");



CREATE INDEX "idx_prices_stripe_price_id" ON "public"."prices" USING "btree" ("stripe_price_id");



CREATE INDEX "idx_products_book_id" ON "public"."products" USING "btree" ("book_id");



CREATE INDEX "idx_products_stripe_product_id" ON "public"."products" USING "btree" ("stripe_product_id");



CREATE INDEX "idx_products_tier_key" ON "public"."products" USING "btree" ("tier_key");



CREATE INDEX "idx_products_type" ON "public"."products" USING "btree" ("product_type");



CREATE INDEX "idx_student_subscriptions_profile_id" ON "public"."student_subscriptions" USING "btree" ("profile_id");



CREATE INDEX "idx_student_subscriptions_status" ON "public"."student_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_student_subscriptions_stripe_subscription_id" ON "public"."student_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_user_audiobook_chapter_progress_chapter" ON "public"."user_audiobook_chapter_progress" USING "btree" ("chapter_id");



CREATE INDEX "idx_user_audiobook_chapter_progress_completed" ON "public"."user_audiobook_chapter_progress" USING "btree" ("profile_id", "book_id", "is_completed");



CREATE INDEX "idx_user_audiobook_chapter_progress_profile_book" ON "public"."user_audiobook_chapter_progress" USING "btree" ("profile_id", "book_id");



CREATE INDEX "idx_user_level_completion_profile_id" ON "public"."user_level_completion" USING "btree" ("profile_id");



CREATE INDEX "support_ticket_messages_sender_profile_id_idx" ON "public"."support_ticket_messages" USING "btree" ("sender_profile_id");



CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "public"."support_ticket_messages" USING "btree" ("ticket_id");



CREATE INDEX "support_tickets_assigned_to_profile_id_idx" ON "public"."support_tickets" USING "btree" ("assigned_to_profile_id");



CREATE INDEX "support_tickets_profile_id_idx" ON "public"."support_tickets" USING "btree" ("profile_id");



CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "trigger_new_chapter_added" AFTER INSERT ON "public"."audiobook_chapters" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_chapter_added"();



CREATE OR REPLACE TRIGGER "trigger_update_audiobook_duration" AFTER INSERT OR DELETE OR UPDATE OF "duration_seconds" ON "public"."audiobook_chapters" FOR EACH ROW EXECUTE FUNCTION "public"."update_audiobook_duration"();



ALTER TABLE ONLY "public"."audiobook_alignment"
    ADD CONSTRAINT "audiobook_alignment_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."audiobooks"("book_id");



ALTER TABLE ONLY "public"."audiobook_alignment"
    ADD CONSTRAINT "audiobook_alignment_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."audiobook_chapters"("chapter_id");



ALTER TABLE ONLY "public"."audiobook_chapters"
    ADD CONSTRAINT "audiobook_chapters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."audiobooks"("book_id");



ALTER TABLE ONLY "public"."audiobooks"
    ADD CONSTRAINT "audiobooks_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code");



ALTER TABLE ONLY "public"."audiobooks"
    ADD CONSTRAINT "audiobooks_level_code_fkey" FOREIGN KEY ("level_code") REFERENCES "public"."language_levels"("level_code");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."lesson_chat_conversations"("conversation_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_related_prompt_id_fkey" FOREIGN KEY ("related_prompt_id") REFERENCES "public"."conversation_starters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_prompt_status"
    ADD CONSTRAINT "conversation_prompt_status_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."lesson_chat_conversations"("conversation_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_prompt_status"
    ADD CONSTRAINT "conversation_prompt_status_first_addressed_message_id_fkey" FOREIGN KEY ("first_addressed_message_id") REFERENCES "public"."conversation_messages"("message_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_prompt_status"
    ADD CONSTRAINT "conversation_prompt_status_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."conversation_starters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_starter_translations"
    ADD CONSTRAINT "conversation_starter_translations_starter_id_fkey" FOREIGN KEY ("starter_id") REFERENCES "public"."conversation_starters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_starters"
    ADD CONSTRAINT "conversation_starters_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictation_attempts"
    ADD CONSTRAINT "dictation_attempts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictation_attempts"
    ADD CONSTRAINT "dictation_attempts_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrases"("phrase_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dictation_attempts"
    ADD CONSTRAINT "dictation_attempts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "fk_conversation_messages_fb_lang" FOREIGN KEY ("feedback_language_code") REFERENCES "public"."languages"("language_code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "fk_conversation_messages_msg_lang" FOREIGN KEY ("message_language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_starter_translations"
    ADD CONSTRAINT "fk_conversation_starter_translations_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictation_attempts"
    ADD CONSTRAINT "fk_dictation_attempts_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_outcome_translations"
    ADD CONSTRAINT "fk_learning_outcome_translations_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_chat_conversations"
    ADD CONSTRAINT "fk_lesson_chat_conversations_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_translations"
    ADD CONSTRAINT "fk_lesson_translations_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phrase_versions"
    ADD CONSTRAINT "fk_phrase_versions_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speech_attempts"
    ADD CONSTRAINT "fk_speech_attempts_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_profiles"
    ADD CONSTRAINT "fk_student_profiles_native_lang" FOREIGN KEY ("native_language_code") REFERENCES "public"."languages"("language_code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_profiles"
    ADD CONSTRAINT "fk_student_profiles_selected_level" FOREIGN KEY ("selected_level_code") REFERENCES "public"."language_levels"("level_code");



ALTER TABLE ONLY "public"."student_profiles"
    ADD CONSTRAINT "fk_student_profiles_target_lang" FOREIGN KEY ("current_target_language_code") REFERENCES "public"."languages"("language_code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_target_languages"
    ADD CONSTRAINT "fk_student_target_languages_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_translations"
    ADD CONSTRAINT "fk_unit_translations_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "fk_units_to_language_levels" FOREIGN KEY ("level") REFERENCES "public"."language_levels"("level_code");



ALTER TABLE ONLY "public"."user_phrase_progress"
    ADD CONSTRAINT "fk_user_phrase_progress_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_points_log"
    ADD CONSTRAINT "fk_user_points_log_related_word_lang" FOREIGN KEY ("related_word_language_code") REFERENCES "public"."languages"("language_code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_word_pronunciation"
    ADD CONSTRAINT "fk_user_word_pronunciation_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_word_spelling"
    ADD CONSTRAINT "fk_user_word_spelling_lang" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_stripe_subscription_id_fkey" FOREIGN KEY ("stripe_subscription_id") REFERENCES "public"."student_subscriptions"("stripe_subscription_id");



ALTER TABLE ONLY "public"."learning_outcome_translations"
    ADD CONSTRAINT "learning_outcome_translations_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "public"."learning_outcomes"("outcome_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_outcomes"
    ADD CONSTRAINT "learning_outcomes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_chat_conversations"
    ADD CONSTRAINT "lesson_chat_conversations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_chat_conversations"
    ADD CONSTRAINT "lesson_chat_conversations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_phrases"
    ADD CONSTRAINT "lesson_phrases_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_phrases"
    ADD CONSTRAINT "lesson_phrases_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrases"("phrase_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_translations"
    ADD CONSTRAINT "lesson_translations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("unit_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partnership_invitations"
    ADD CONSTRAINT "partnership_invitations_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnerships"("id");



ALTER TABLE ONLY "public"."partnership_invitations"
    ADD CONSTRAINT "partnership_invitations_redeemed_by_profile_id_fkey" FOREIGN KEY ("redeemed_by_profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phrase_versions"
    ADD CONSTRAINT "phrase_versions_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrases"("phrase_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."audiobooks"("book_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnerships"("id");



ALTER TABLE ONLY "public"."speech_attempts"
    ADD CONSTRAINT "speech_attempts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speech_attempts"
    ADD CONSTRAINT "speech_attempts_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrases"("phrase_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."speech_attempts"
    ADD CONSTRAINT "speech_attempts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_profiles"
    ADD CONSTRAINT "student_profiles_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnerships"("id");



ALTER TABLE ONLY "public"."student_profiles"
    ADD CONSTRAINT "student_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_subscriptions"
    ADD CONSTRAINT "student_subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id");



ALTER TABLE ONLY "public"."student_subscriptions"
    ADD CONSTRAINT "student_subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_target_languages"
    ADD CONSTRAINT "student_target_languages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("ticket_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_profile_id_fkey" FOREIGN KEY ("assigned_to_profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id");



ALTER TABLE ONLY "public"."tour_steps"
    ADD CONSTRAINT "tour_steps_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("tour_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_translations"
    ADD CONSTRAINT "unit_translations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("unit_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_audiobook_chapter_progress"
    ADD CONSTRAINT "user_audiobook_chapter_progress_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."audiobooks"("book_id");



ALTER TABLE ONLY "public"."user_audiobook_chapter_progress"
    ADD CONSTRAINT "user_audiobook_chapter_progress_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."audiobook_chapters"("chapter_id");



ALTER TABLE ONLY "public"."user_audiobook_chapter_progress"
    ADD CONSTRAINT "user_audiobook_chapter_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id");



ALTER TABLE ONLY "public"."user_audiobook_progress"
    ADD CONSTRAINT "user_audiobook_progress_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."audiobooks"("book_id");



ALTER TABLE ONLY "public"."user_audiobook_progress"
    ADD CONSTRAINT "user_audiobook_progress_current_chapter_id_fkey" FOREIGN KEY ("current_chapter_id") REFERENCES "public"."audiobook_chapters"("chapter_id");



ALTER TABLE ONLY "public"."user_audiobook_progress"
    ADD CONSTRAINT "user_audiobook_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id");



ALTER TABLE ONLY "public"."user_audiobook_purchases"
    ADD CONSTRAINT "user_audiobook_purchases_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."audiobooks"("book_id");



ALTER TABLE ONLY "public"."user_audiobook_purchases"
    ADD CONSTRAINT "user_audiobook_purchases_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id");



ALTER TABLE ONLY "public"."user_lesson_activity_progress"
    ADD CONSTRAINT "user_lesson_activity_progress_user_lesson_progress_id_fkey" FOREIGN KEY ("user_lesson_progress_id") REFERENCES "public"."user_lesson_progress"("progress_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_level_completion"
    ADD CONSTRAINT "user_level_completion_level_code_fkey" FOREIGN KEY ("level_code") REFERENCES "public"."language_levels"("level_code");



ALTER TABLE ONLY "public"."user_level_completion"
    ADD CONSTRAINT "user_level_completion_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_phrase_progress"
    ADD CONSTRAINT "user_phrase_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_phrase_progress"
    ADD CONSTRAINT "user_phrase_progress_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrases"("phrase_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_phrase_progress"
    ADD CONSTRAINT "user_phrase_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_points_log"
    ADD CONSTRAINT "user_points_log_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_points_log"
    ADD CONSTRAINT "user_points_log_related_lesson_id_fkey" FOREIGN KEY ("related_lesson_id") REFERENCES "public"."lessons"("lesson_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_points_log"
    ADD CONSTRAINT "user_points_log_related_phrase_id_fkey" FOREIGN KEY ("related_phrase_id") REFERENCES "public"."phrases"("phrase_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_srs_data"
    ADD CONSTRAINT "user_srs_data_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_srs_data"
    ADD CONSTRAINT "user_srs_data_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "public"."phrases"("phrase_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_srs_data"
    ADD CONSTRAINT "user_srs_data_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tour_progress"
    ADD CONSTRAINT "user_tour_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tour_progress"
    ADD CONSTRAINT "user_tour_progress_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("tour_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_word_pronunciation"
    ADD CONSTRAINT "user_word_pronunciation_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_word_spelling"
    ADD CONSTRAINT "user_word_spelling_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("profile_id") ON DELETE CASCADE;



CREATE POLICY "Allow admin users to delete audiobooks" ON "public"."audiobooks" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "Allow admin users to insert audiobook alignment" ON "public"."audiobook_alignment" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "Allow admin users to insert audiobook chapters" ON "public"."audiobook_chapters" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "Allow admin users to insert audiobooks" ON "public"."audiobooks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "Allow admin users to update audiobook alignment" ON "public"."audiobook_alignment" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "Allow admin users to update audiobook chapters" ON "public"."audiobook_chapters" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "Allow admin users to update audiobooks" ON "public"."audiobooks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role_enum"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "Allow authenticated users to read active audiobooks" ON "public"."audiobooks" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Allow authenticated users to read audiobook alignment" ON "public"."audiobook_alignment" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read audiobook chapters" ON "public"."audiobook_chapters" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can insert their own audiobook progress" ON "public"."user_audiobook_progress" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own audiobook purchases" ON "public"."user_audiobook_purchases" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own chapter progress" ON "public"."user_audiobook_chapter_progress" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can read their own audiobook progress" ON "public"."user_audiobook_progress" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can read their own audiobook purchases" ON "public"."user_audiobook_purchases" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can read their own chapter progress" ON "public"."user_audiobook_chapter_progress" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own audiobook progress" ON "public"."user_audiobook_progress" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own chapter progress" ON "public"."user_audiobook_chapter_progress" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "allow_delete_for_admins_only" ON "public"."partnerships" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "allow_insert_for_admins_only" ON "public"."partnerships" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_enum")))));



CREATE POLICY "allow_select_on_own_or_all_partnerships" ON "public"."partnerships" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     LEFT JOIN "public"."student_profiles" "sp" ON (("p"."id" = "sp"."profile_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."role" = 'admin'::"public"."user_role_enum") OR (("p"."role" = 'partnership_manager'::"public"."user_role_enum") AND ("partnerships"."id" = "p"."partnership_id")) OR (("p"."role" = 'student'::"public"."user_role_enum") AND ("partnerships"."id" = "sp"."partnership_id")))))));



CREATE POLICY "allow_update_on_own_or_all_partnerships" ON "public"."partnerships" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."role" = 'admin'::"public"."user_role_enum") OR (("p"."role" = 'partnership_manager'::"public"."user_role_enum") AND ("partnerships"."id" = "p"."partnership_id")))))));



ALTER TABLE "public"."audiobook_alignment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audiobook_chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audiobooks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_or_admin_partnership_invitations" ON "public"."partnership_invitations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("p"."role" = 'admin'::"public"."user_role_enum") OR (("p"."role" = 'partnership_manager'::"public"."user_role_enum") AND ("partnership_invitations"."partnership_id" = "p"."partnership_id")))))));



CREATE POLICY "insert_own_or_admin_partnership_invitations" ON "public"."partnership_invitations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("p"."role" = 'admin'::"public"."user_role_enum") OR (("p"."role" = 'partnership_manager'::"public"."user_role_enum") AND ("partnership_invitations"."partnership_id" = "p"."partnership_id")))))));



ALTER TABLE "public"."partnership_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partnerships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_or_admin_partnership_invitations" ON "public"."partnership_invitations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("p"."role" = 'admin'::"public"."user_role_enum") OR (("p"."role" = 'partnership_manager'::"public"."user_role_enum") AND ("partnership_invitations"."partnership_id" = "p"."partnership_id")))))));



CREATE POLICY "update_own_or_admin_partnership_invitations" ON "public"."partnership_invitations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("p"."role" = 'admin'::"public"."user_role_enum") OR (("p"."role" = 'partnership_manager'::"public"."user_role_enum") AND ("partnership_invitations"."partnership_id" = "p"."partnership_id"))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("p"."role" = 'admin'::"public"."user_role_enum") OR (("p"."role" = 'partnership_manager'::"public"."user_role_enum") AND ("partnership_invitations"."partnership_id" = "p"."partnership_id")))))));



ALTER TABLE "public"."user_audiobook_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_audiobook_purchases" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "authenticator";














































































































































































GRANT ALL ON FUNCTION "public"."admin_fix_user_tier"("user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_fix_user_tier"("user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_fix_user_tier"("user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_book_completion"("p_profile_id" "uuid", "p_book_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_book_completion"("p_profile_id" "uuid", "p_book_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_book_completion"("p_profile_id" "uuid", "p_book_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_access_lesson"("profile_id_param" "uuid", "lesson_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_access_lesson"("profile_id_param" "uuid", "lesson_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_access_lesson"("profile_id_param" "uuid", "lesson_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_access_level"("profile_id_param" "uuid", "level_code_param" "public"."level_enum") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_access_level"("profile_id_param" "uuid", "level_code_param" "public"."level_enum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_access_level"("profile_id_param" "uuid", "level_code_param" "public"."level_enum") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_access_unit"("profile_id_param" "uuid", "unit_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_access_unit"("profile_id_param" "uuid", "unit_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_access_unit"("profile_id_param" "uuid", "unit_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_award_unit_completion_bonus"("profile_id_param" "uuid", "unit_id_param" integer, "triggering_lesson_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_award_unit_completion_bonus"("profile_id_param" "uuid", "unit_id_param" integer, "triggering_lesson_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_unit_completion_bonus"("profile_id_param" "uuid", "unit_id_param" integer, "triggering_lesson_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_audiobook_ownership"("p_profile_id" "uuid", "p_book_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_audiobook_ownership"("p_profile_id" "uuid", "p_book_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_audiobook_ownership"("p_profile_id" "uuid", "p_book_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_user_subscriptions"("user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_user_subscriptions"("user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_user_subscriptions"("user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_partnership_trials"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_partnership_trials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_partnership_trials"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_audiobook_purchases"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_audiobook_purchases"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_audiobook_purchases"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_available_levels"("profile_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_available_levels"("profile_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_available_levels"("profile_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_billing_summary"("user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_billing_summary"("user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_billing_summary"("user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_highest_tier"("user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_highest_tier"("user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_highest_tier"("user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_progression_status"("profile_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_progression_status"("profile_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_progression_status"("profile_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_chapter_added"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_chapter_added"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_chapter_added"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_subscription_tier_conflict"("user_profile_id" "uuid", "new_tier" "public"."subscription_tier_enum") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_subscription_tier_conflict"("user_profile_id" "uuid", "new_tier" "public"."subscription_tier_enum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_subscription_tier_conflict"("user_profile_id" "uuid", "new_tier" "public"."subscription_tier_enum") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_streak"("profile_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_streak"("profile_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_streak"("profile_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_word_pronunciation_update"("profile_id_param" "uuid", "language_code_param" character varying, "word_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_word_pronunciation_update"("profile_id_param" "uuid", "language_code_param" character varying, "word_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_word_pronunciation_update"("profile_id_param" "uuid", "language_code_param" character varying, "word_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_lesson_complete"("p_profile_id" "uuid", "p_lesson_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_lesson_complete"("p_profile_id" "uuid", "p_lesson_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_lesson_complete"("p_profile_id" "uuid", "p_lesson_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_unit_complete"("p_profile_id" "uuid", "p_unit_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_unit_complete"("p_profile_id" "uuid", "p_unit_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_unit_complete"("p_profile_id" "uuid", "p_unit_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_chat_completion"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."process_chat_completion"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_chat_completion"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_user_activity"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying, "activity_type_param" "public"."activity_type_enum", "phrase_id_param" integer, "reference_text_param" "text", "recognized_text_param" "text", "accuracy_score_param" numeric, "fluency_score_param" numeric, "completeness_score_param" numeric, "pronunciation_score_param" numeric, "prosody_score_param" numeric, "phonetic_data_param" "jsonb", "written_text_param" "text", "overall_similarity_score_param" numeric, "word_level_feedback_param" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_user_activity"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying, "activity_type_param" "public"."activity_type_enum", "phrase_id_param" integer, "reference_text_param" "text", "recognized_text_param" "text", "accuracy_score_param" numeric, "fluency_score_param" numeric, "completeness_score_param" numeric, "pronunciation_score_param" numeric, "prosody_score_param" numeric, "phonetic_data_param" "jsonb", "written_text_param" "text", "overall_similarity_score_param" numeric, "word_level_feedback_param" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_user_activity"("profile_id_param" "uuid", "lesson_id_param" integer, "language_code_param" character varying, "activity_type_param" "public"."activity_type_enum", "phrase_id_param" integer, "reference_text_param" "text", "recognized_text_param" "text", "accuracy_score_param" numeric, "fluency_score_param" numeric, "completeness_score_param" numeric, "pronunciation_score_param" numeric, "prosody_score_param" numeric, "phonetic_data_param" "jsonb", "written_text_param" "text", "overall_similarity_score_param" numeric, "word_level_feedback_param" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_word_practice_attempt"("profile_id_param" "uuid", "word_text_param" character varying, "language_code_param" character varying, "accuracy_score_param" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_word_practice_attempt"("profile_id_param" "uuid", "word_text_param" character varying, "language_code_param" character varying, "accuracy_score_param" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_word_practice_attempt"("profile_id_param" "uuid", "word_text_param" character varying, "language_code_param" character varying, "accuracy_score_param" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_partnership_invitation"("p_token" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_partnership_invitation"("p_token" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_partnership_invitation"("p_token" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_audiobook_duration"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_audiobook_duration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_audiobook_duration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chapter_progress"("p_profile_id" "uuid", "p_book_id" integer, "p_chapter_id" integer, "p_position_seconds" numeric, "p_chapter_duration_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_chapter_progress"("p_profile_id" "uuid", "p_book_id" integer, "p_chapter_id" integer, "p_position_seconds" numeric, "p_chapter_duration_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chapter_progress"("p_profile_id" "uuid", "p_book_id" integer, "p_chapter_id" integer, "p_position_seconds" numeric, "p_chapter_duration_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_subscription_tier"("user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_subscription_tier"("user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_subscription_tier"("user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_audiobook_purchase"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_invoice_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_audiobook_purchase"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_invoice_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_audiobook_purchase"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_invoice_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_stripe_invoice"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_invoice_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_stripe_invoice"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_invoice_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_stripe_invoice"("p_stripe_invoice_id" "text", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_invoice_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_stripe_subscription"("p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_subscription_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_stripe_subscription"("p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_subscription_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_stripe_subscription"("p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_subscription_data" "jsonb") TO "service_role";
























GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobook_alignment" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobook_alignment" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobook_alignment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audiobook_alignment_alignment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audiobook_alignment_alignment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audiobook_alignment_alignment_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobook_chapters" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobook_chapters" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobook_chapters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audiobook_chapters_chapter_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audiobook_chapters_chapter_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audiobook_chapters_chapter_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobooks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobooks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audiobooks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audiobooks_book_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audiobooks_book_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audiobooks_book_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversation_messages_message_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversation_messages_message_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversation_messages_message_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_prompt_status" TO "anon";
GRANT ALL ON TABLE "public"."conversation_prompt_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_prompt_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversation_prompt_status_prompt_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversation_prompt_status_prompt_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversation_prompt_status_prompt_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_starter_translations" TO "anon";
GRANT ALL ON TABLE "public"."conversation_starter_translations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_starter_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversation_starter_translations_starter_translation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversation_starter_translations_starter_translation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversation_starter_translations_starter_translation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_starters" TO "anon";
GRANT ALL ON TABLE "public"."conversation_starters" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_starters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversation_starters_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversation_starters_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversation_starters_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dictation_attempts" TO "anon";
GRANT ALL ON TABLE "public"."dictation_attempts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."dictation_attempts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dictation_attempts_attempt_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dictation_attempts_attempt_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dictation_attempts_attempt_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."language_levels" TO "anon";
GRANT ALL ON TABLE "public"."language_levels" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."language_levels" TO "service_role";



GRANT ALL ON TABLE "public"."languages" TO "anon";
GRANT ALL ON TABLE "public"."languages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."languages" TO "service_role";



GRANT ALL ON TABLE "public"."learning_outcome_translations" TO "anon";
GRANT ALL ON TABLE "public"."learning_outcome_translations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."learning_outcome_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."learning_outcome_translations_outcome_translation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."learning_outcome_translations_outcome_translation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."learning_outcome_translations_outcome_translation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."learning_outcomes" TO "anon";
GRANT ALL ON TABLE "public"."learning_outcomes" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."learning_outcomes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."learning_outcomes_outcome_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."learning_outcomes_outcome_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."learning_outcomes_outcome_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."lesson_chat_conversations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_chat_conversations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lesson_chat_conversations_conversation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lesson_chat_conversations_conversation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lesson_chat_conversations_conversation_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_phrases" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_phrases" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_phrases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lesson_phrases_lesson_phrase_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lesson_phrases_lesson_phrase_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lesson_phrases_lesson_phrase_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_translations" TO "anon";
GRANT ALL ON TABLE "public"."lesson_translations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lesson_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lesson_translations_lesson_translation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lesson_translations_lesson_translation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lesson_translations_lesson_translation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lessons_lesson_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lessons_lesson_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lessons_lesson_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."partnership_invitations" TO "anon";
GRANT ALL ON TABLE "public"."partnership_invitations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."partnership_invitations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."partnership_invitations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."partnership_invitations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."partnership_invitations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."partnerships" TO "anon";
GRANT ALL ON TABLE "public"."partnerships" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."partnerships" TO "service_role";



GRANT ALL ON SEQUENCE "public"."partnerships_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."partnerships_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."partnerships_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."phrase_versions" TO "anon";
GRANT ALL ON TABLE "public"."phrase_versions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phrase_versions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."phrase_versions_phrase_version_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."phrase_versions_phrase_version_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."phrase_versions_phrase_version_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phrases" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phrases" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phrases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."phrases_phrase_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."phrases_phrase_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."phrases_phrase_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."prices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."prices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."speech_attempts" TO "anon";
GRANT ALL ON TABLE "public"."speech_attempts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."speech_attempts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."speech_attempts_attempt_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."speech_attempts_attempt_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."speech_attempts_attempt_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."student_profiles" TO "anon";
GRANT ALL ON TABLE "public"."student_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."student_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."student_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."student_subscriptions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."student_subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."student_subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."student_subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."student_subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."student_target_languages" TO "anon";
GRANT ALL ON TABLE "public"."student_target_languages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."student_target_languages" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_ticket_messages" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_ticket_messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_ticket_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."support_ticket_messages_message_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."support_ticket_messages_message_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."support_ticket_messages_message_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_tickets" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_tickets" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."support_tickets_ticket_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."support_tickets_ticket_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."support_tickets_ticket_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tour_steps" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tour_steps" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tour_steps" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tour_steps_step_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tour_steps_step_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tour_steps_step_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tours" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tours" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tours" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tours_tour_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tours_tour_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tours_tour_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."unit_translations" TO "anon";
GRANT ALL ON TABLE "public"."unit_translations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."unit_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."unit_translations_unit_translation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."unit_translations_unit_translation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."unit_translations_unit_translation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."units" TO "service_role";



GRANT ALL ON SEQUENCE "public"."units_unit_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."units_unit_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."units_unit_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_chapter_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_chapter_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_chapter_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_audiobook_chapter_progress_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_audiobook_chapter_progress_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_audiobook_chapter_progress_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_audiobook_progress_progress_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_audiobook_progress_progress_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_audiobook_progress_progress_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_purchases" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_purchases" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_audiobook_purchases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_audiobook_purchases_purchase_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_audiobook_purchases_purchase_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_audiobook_purchases_purchase_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_lesson_activity_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_lesson_activity_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_lesson_activity_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_lesson_activity_progress_activity_progress_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_lesson_activity_progress_activity_progress_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_lesson_activity_progress_activity_progress_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_lesson_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_lesson_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_lesson_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_lesson_progress_progress_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_lesson_progress_progress_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_lesson_progress_progress_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_level_completion" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_level_completion" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_level_completion" TO "service_role";



GRANT ALL ON TABLE "public"."user_phrase_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_phrase_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_phrase_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_phrase_progress_phrase_progress_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_phrase_progress_phrase_progress_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_phrase_progress_phrase_progress_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_points_log" TO "anon";
GRANT ALL ON TABLE "public"."user_points_log" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_points_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_points_log_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_points_log_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_points_log_log_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_srs_data" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_srs_data" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_srs_data" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_srs_data_user_srs_data_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_srs_data_user_srs_data_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_srs_data_user_srs_data_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tour_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tour_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tour_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_word_pronunciation" TO "anon";
GRANT ALL ON TABLE "public"."user_word_pronunciation" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_word_pronunciation" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_word_pronunciation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_word_pronunciation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_word_pronunciation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_word_spelling" TO "anon";
GRANT ALL ON TABLE "public"."user_word_spelling" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_word_spelling" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_word_spelling_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_word_spelling_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_word_spelling_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";



























RESET ALL;
