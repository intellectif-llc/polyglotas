import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleProductSync(productData: any) {
  try {
    const { error } = await supabase
      .from('products')
      .upsert({
        stripe_product_id: productData.id,
        active: productData.active,
        name: productData.name,
        description: productData.description,
        tier_key: productData.name.toLowerCase().includes('pro') ? 'pro' : 
                  productData.name.toLowerCase().includes('starter') ? 'starter' : null,
        metadata: productData.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_product_id'
      });

    if (error) {
      console.error('Error syncing product:', error);
    } else {
      console.log(`Product ${productData.id} synced successfully`);
    }
  } catch (error) {
    console.error('Error in handleProductSync:', error);
  }
}

async function handlePriceSync(priceData: any) {
  try {
    // Get product_id from products table
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('stripe_product_id', priceData.product)
      .single();

    const { error } = await supabase
      .from('prices')
      .upsert({
        stripe_price_id: priceData.id,
        product_id: product?.id,
        active: priceData.active,
        unit_amount: priceData.unit_amount || priceData.amount,
        currency: priceData.currency,
        type: priceData.type || 'recurring',
        billing_interval: priceData.recurring?.interval || priceData.interval,
        interval_count: priceData.recurring?.interval_count || priceData.interval_count,
        description: priceData.nickname,
        trial_period_days: priceData.recurring?.trial_period_days || priceData.trial_period_days,
        metadata: priceData.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_price_id'
      });

    if (error) {
      console.error('Error syncing price:', error);
    } else {
      console.log(`Price ${priceData.id} synced successfully`);
    }
  } catch (error) {
    console.error('Error in handlePriceSync:', error);
  }
}

async function handleProductDelete(stripeProductId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('stripe_product_id', stripeProductId);

    if (error) {
      console.error('Error deleting product:', error);
    } else {
      console.log(`Product ${stripeProductId} deleted successfully`);
    }
  } catch (error) {
    console.error('Error in handleProductDelete:', error);
  }
}

async function handlePriceDelete(stripePriceId: string) {
  try {
    const { error } = await supabase
      .from('prices')
      .delete()
      .eq('stripe_price_id', stripePriceId);

    if (error) {
      console.error('Error deleting price:', error);
    } else {
      console.log(`Price ${stripePriceId} deleted successfully`);
    }
  } catch (error) {
    console.error('Error in handlePriceDelete:', error);
  }
}

/**
 * POST handler for Stripe webhook events
 * Logs all webhook events for analysis before implementing sync logic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SIGNING_SECRET not configured');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    if (!signature) {
      return new NextResponse('Missing signature', { status: 400 });
    }

    // Verify webhook signature
    const elements = signature.split(',');
    const signatureElements = elements.reduce((acc, element) => {
      const [key, value] = element.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${signatureElements.t}.${body}`, 'utf8')
      .digest('hex');

    if (expectedSignature !== signatureElements.v1) {
      console.error('Invalid webhook signature');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // Parse the webhook event
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('Invalid JSON in webhook body:', err);
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    // Log the webhook event
    console.log(`Stripe webhook: ${event.type} - ${event.id}`);

    // Handle different event types
    switch (event.type) {
      case 'product.created':
      case 'product.updated':
        await handleProductSync(event.data.object);
        break;
        
      case 'product.deleted':
        await handleProductDelete(event.data.object.id);
        break;
        
      case 'price.created':
      case 'price.updated':
      case 'plan.created':
      case 'plan.updated':
        await handlePriceSync(event.data.object);
        break;
        
      case 'price.deleted':
      case 'plan.deleted':
        await handlePriceDelete(event.data.object.id);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse('Webhook processed', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}