set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.redeem_partnership_invitation(p_token uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Get invitation details
  SELECT
    pi.*,
    p.discount_percentage
  INTO v_invitation
  FROM public.partnership_invitations pi
  JOIN public.partnerships p ON pi.partnership_id = p.id
  WHERE pi.token = p_token
    AND pi.status = 'pending'
    AND pi.expires_at > now();

  -- Validate invitation
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_token');
  END IF;

  -- Check email match
  IF v_invitation.intended_for_email != v_user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
  END IF;

  -- Update invitation
  UPDATE public.partnership_invitations
  SET
    status = 'redeemed',
    redeemed_by_profile_id = p_user_id,
    redeemed_at = now()
  WHERE id = v_invitation.id;

  -- Update profiles table
  UPDATE public.profiles
  SET partnership_id = v_invitation.partnership_id
  WHERE id = p_user_id;

  -- Update student_profiles table (both discount AND partnership_id)
  UPDATE public.student_profiles
  SET
    discount = v_invitation.discount_percentage,
    partnership_id = v_invitation.partnership_id,
    updated_at = now()
  WHERE profile_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'invitation', row_to_json(v_invitation)
  );
END;
$function$
;


