import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function POST() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile and check if they already have a Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("stripe_customer_id")
      .eq("profile_id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // If customer already exists, return the existing customer ID
    if (profile.stripe_customer_id) {
      return NextResponse.json({
        customer_id: profile.stripe_customer_id,
        exists: true,
      });
    }

    // Get user's basic profile info
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name:
        userProfile && !userProfileError
          ? `${userProfile.first_name || ""} ${
              userProfile.last_name || ""
            }`.trim()
          : undefined,
      metadata: {
        user_id: user.id,
      },
    });

    // Update the user's profile with the Stripe customer ID
    const { error: updateError } = await supabase
      .from("student_profiles")
      .update({
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error(
        "Error updating profile with Stripe customer ID:",
        updateError
      );
      // Note: We don't delete the Stripe customer here as it might be useful for debugging
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customer_id: customer.id,
      exists: false,
    });
  } catch (error) {
    console.error("Error creating Stripe customer:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's stripe_customer_id and subscription info
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("stripe_customer_id, subscription_tier")
      .eq("profile_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    let customerInfo = null;
    let subscriptions: Array<{
      id: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
      items: Array<{
        price: string;
        quantity: number;
      }>;
    }> = [];

    if (profile.stripe_customer_id) {
      try {
        // Get customer info from Stripe
        const customer = await stripe.customers.retrieve(
          profile.stripe_customer_id
        );

        if (!customer.deleted) {
          customerInfo = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            created: customer.created,
          };

          // Get active subscriptions from our database instead of Stripe
          const { data: dbSubscriptions } = await supabase
            .from('student_subscriptions')
            .select(`
              stripe_subscription_id,
              status,
              current_period_start,
              current_period_end,
              cancel_at_period_end,
              quantity,
              prices!inner(
                stripe_price_id
              )
            `)
            .eq('profile_id', user.id)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false });

          subscriptions = (dbSubscriptions || []).map((sub) => {
            const mappedSub = {
              id: sub.stripe_subscription_id,
              status: sub.status,
              current_period_start: sub.current_period_start,
              current_period_end: sub.current_period_end,
              cancel_at_period_end: sub.cancel_at_period_end,
              items: [{
                price: (sub.prices as any).stripe_price_id,
                quantity: sub.quantity || 1,
              }],
            };

            return mappedSub;
          });
        }
      } catch (stripeError) {
        console.error("Error fetching customer from Stripe:", stripeError);
        // Continue without Stripe data - user might not have a customer yet
      }
    }

    const responseData = {
      profile: {
        subscription_tier: profile.subscription_tier,
        stripe_customer_id: profile.stripe_customer_id,
      },
      customer: customerInfo,
      subscriptions,
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching customer info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
