import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check trial eligibility
    const { data: eligibility, error: eligibilityError } = await serviceSupabase
      .rpc('get_trial_eligibility_details', {
        user_profile_id: user.id
      });

    if (eligibilityError || !eligibility?.[0]?.is_eligible) {
      return NextResponse.json(
        { 
          error: "Not eligible for trial",
          reason: eligibility?.[0]?.reason_message || "Unknown eligibility issue"
        },
        { status: 400 }
      );
    }

    // Get Pro monthly price
    const { data: priceData, error: priceError } = await supabase
      .from("prices")
      .select(`
        id,
        stripe_price_id,
        products!inner(
          name,
          tier_key
        )
      `)
      .eq("products.tier_key", "pro")
      .eq("active", true)
      .eq("billing_interval", "month")
      .limit(1)
      .single();

    if (priceError || !priceData) {
      return NextResponse.json({ error: "Pro plan not available" }, { status: 400 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("stripe_customer_id")
      .eq("profile_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if they don't have one
    if (!customerId) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name: userProfile
          ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
          : undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update the user's profile with the Stripe customer ID
      await supabase
        .from("student_profiles")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id);
    }

    // Get the correct base URL
    const host = request.headers.get("host") || request.nextUrl.host;
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const successUrl = `${baseUrl}/account/billing?trial_started=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/account/billing?trial_canceled=true`;

    // Create checkout session with trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceData.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 7,
      },
      metadata: {
        user_id: user.id,
        tier_key: "pro",
        trial_type: "standard_trial",
      },
      allow_promotion_codes: false, // Disable for trials
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
        name: "auto",
      },
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Error creating trial checkout session:", error);

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