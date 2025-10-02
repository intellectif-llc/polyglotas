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
  -- Step 1: Get the user's email from the authentication service.
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Step 2: Retrieve the invitation and the associated partnership details in one query.
  -- This is more efficient than separate queries.
  SELECT
    pi.*,
    p.discount_percentage
  INTO v_invitation
  FROM public.partnership_invitations pi
  JOIN public.partnerships p ON pi.partnership_id = p.id
  WHERE pi.token = p_token
    AND pi.status = 'pending'
    AND pi.expires_at > now();

  -- Step 3: Validate the invitation.
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_token');
  END IF;

  -- Step 4: Ensure the invitation is intended for the user redeeming it.
  IF v_invitation.intended_for_email != v_user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
  END IF;

  -- Step 5: Update the invitation to mark it as redeemed.
  -- This bypasses RLS due to SECURITY DEFINER.
  UPDATE public.partnership_invitations
  SET
    status = 'redeemed',
    redeemed_by_profile_id = p_user_id,
    redeemed_at = now()
  WHERE id = v_invitation.id;

  -- Step 6: Associate the user's main profile with the partnership.
  UPDATE public.profiles
  SET partnership_id = v_invitation.partnership_id
  WHERE id = p_user_id;

  -- Step 7: Conditionally apply the discount to the student's profile.
  -- This UPDATE only runs if the user has a student profile, making the function
  -- robust for different user types.
  UPDATE public.student_profiles
  SET
    discount = v_invitation.discount_percentage,
    updated_at = now()
  WHERE profile_id = p_user_id;

  -- Step 8: Return a success response with the redeemed invitation details.
  RETURN jsonb_build_object(
    'success', true,
    'invitation', row_to_json(v_invitation)
  );
END;
$function$
;


