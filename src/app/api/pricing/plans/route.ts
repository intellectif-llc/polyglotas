import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type ProductInfo = {
  name: string;
  tier_key: string;
};

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch available pricing plans using service client (bypasses RLS)
    const { data: plans, error } = await supabase
      .from("prices")
      .select(
        `
        id,
        stripe_price_id,
        unit_amount,
        currency,
        billing_interval,
        interval_count,
        product_id,
        products (
          name,
          tier_key
        )
      `
      )
      .eq("active", true)
      .not("products.tier_key", "is", null)
      .order("unit_amount", { ascending: true });

    if (error) {
      console.error("Error fetching public plans:", error);
      return NextResponse.json(
        { error: "Failed to fetch plans" },
        { status: 500 }
      );
    }

    // Transform the data for the frontend
    const formattedPlans =
      plans?.map((plan) => ({
        id: plan.id,
        stripe_price_id: plan.stripe_price_id,
        unit_amount: plan.unit_amount,
        currency: plan.currency,
        billing_interval: plan.billing_interval,
        interval_count: plan.interval_count,
        product_name: Array.isArray(plan.products) ? plan.products[0]?.name : (plan.products as ProductInfo)?.name,
        tier_key: Array.isArray(plan.products) ? plan.products[0]?.tier_key : (plan.products as ProductInfo)?.tier_key,
      })) || [];

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error("Error in public plans API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}