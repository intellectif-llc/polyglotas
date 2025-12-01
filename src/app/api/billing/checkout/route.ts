import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

interface CheckoutRequest {
  price_id: string;
  return_url?: string;
  cancel_url?: string;
}

export async function POST(request: NextRequest) {
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

    const { price_id, return_url, cancel_url }: CheckoutRequest =
      await request.json();

    if (!price_id) {
      return NextResponse.json(
        { error: "price_id is required" },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("stripe_customer_id, discount")
      .eq("profile_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify the price exists in our database
    type ProductData = { tier_key: string; name: string } | { tier_key: string; name: string }[];
    const { data: priceData, error: priceError } = await supabase
      .from("prices")
      .select(
        `
        id,
        stripe_price_id,
        products (
          name,
          tier_key
        )
      `
      )
      .eq("stripe_price_id", price_id)
      .eq("active", true)
      .single();

    if (priceError || !priceData) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    const products = priceData.products as ProductData;

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if they don't have one
    if (!customerId) {
      // Get user's basic profile info
      const { data: userProfile, error: userProfileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name:
          userProfile && !userProfileError
            ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
              }`.trim()
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

    // Handle Partnership Discount
    let discounts = undefined;

    if (profile.discount && profile.discount > 0) {
      const discountPercent = Number(profile.discount);
      const couponId = `PARTNER_${discountPercent}_OFF`;

      try {
        // Check if coupon exists
        await stripe.coupons.retrieve(couponId);
      } catch {
        // Create coupon if it doesn't exist
        console.log(`Creating new partnership coupon: ${couponId}`);
        await stripe.coupons.create({
          id: couponId,
          percent_off: discountPercent,
          duration: "forever",
          name: `Partnership Discount (${discountPercent}% off)`,
        });
      }

      discounts = [{ coupon: couponId }];
    }

    // Get the correct base URL, prioritizing forwarded host (for ngrok/proxy usage)
    const host =
      request.headers.get("host") ||
      request.headers.get("x-forwarded-host") ||
      request.nextUrl.host;
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
    const baseUrl = `${protocol}://${host}`;

    const defaultReturnUrl = `${baseUrl}/account/billing?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${baseUrl}/account/billing?canceled=true`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: return_url || defaultReturnUrl,
      cancel_url: cancel_url || defaultCancelUrl,
      metadata: {
        user_id: user.id,
        tier_key: Array.isArray(products)
          ? products[0]?.tier_key || "unknown"
          : products?.tier_key || "unknown",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier_key: Array.isArray(products)
            ? products[0]?.tier_key || "unknown"
            : products?.tier_key || "unknown",
        },
      },
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
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
    console.error("Error creating checkout session:", error);

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

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer: session.customer,
        subscription: session.subscription,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    console.error("Error retrieving checkout session:", error);

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
