import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleProductSync(productData: Record<string, unknown>) {
  try {
    const name = String(productData.name || "");
    const { error } = await supabase.from("products").upsert(
      {
        stripe_product_id: productData.id as string,
        active: productData.active as boolean,
        name,
        description: productData.description as string,
        tier_key: name.toLowerCase().includes("pro")
          ? "pro"
          : name.toLowerCase().includes("starter")
          ? "starter"
          : null,
        metadata: productData.metadata,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_product_id",
      }
    );

    if (error) {
      console.error("Error syncing product:", error);
    } else {
      console.log(`Product ${productData.id} synced successfully`);
    }
  } catch (error) {
    console.error("Error in handleProductSync:", error);
  }
}

async function handlePriceSync(priceData: Record<string, unknown>) {
  try {
    // Get product_id from products table
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("stripe_product_id", priceData.product as string)
      .single();

    const recurring = priceData.recurring as
      | Record<string, unknown>
      | undefined;
    const { error } = await supabase.from("prices").upsert(
      {
        stripe_price_id: priceData.id as string,
        product_id: product?.id,
        active: priceData.active as boolean,
        unit_amount: (priceData.unit_amount || priceData.amount) as number,
        currency: priceData.currency as string,
        type: (priceData.type || "recurring") as string,
        billing_interval: (recurring?.interval || priceData.interval) as string,
        interval_count: (recurring?.interval_count ||
          priceData.interval_count) as number,
        description: priceData.nickname as string,
        trial_period_days: (recurring?.trial_period_days ||
          priceData.trial_period_days) as number,
        metadata: priceData.metadata,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_price_id",
      }
    );

    if (error) {
      console.error("Error syncing price:", error);
    } else {
      console.log(`Price ${priceData.id} synced successfully`);
      
      // Also update audiobook price if this is an audiobook product
      if (product?.id) {
        const { data: audiobookProduct } = await supabase
          .from('products')
          .select('book_id, product_type')
          .eq('id', product.id)
          .eq('product_type', 'audiobook')
          .single();
          
        if (audiobookProduct?.book_id) {
          const { error: audiobookError } = await supabase
            .from('audiobooks')
            .update({ 
              price_cents: (priceData.unit_amount || priceData.amount) as number,
              updated_at: new Date().toISOString()
            })
            .eq('book_id', audiobookProduct.book_id);
            
          if (audiobookError) {
            console.error(`Error updating audiobook price for book_id ${audiobookProduct.book_id}:`, audiobookError);
          } else {
            console.log(`Audiobook price updated for book_id ${audiobookProduct.book_id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in handlePriceSync:", error);
  }
}

async function handleProductDelete(stripeProductId: string) {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("stripe_product_id", stripeProductId);

    if (error) {
      console.error("Error deleting product:", error);
    } else {
      console.log(`Product ${stripeProductId} deleted successfully`);
    }
  } catch (error) {
    console.error("Error in handleProductDelete:", error);
  }
}

async function handlePriceDelete(stripePriceId: string) {
  try {
    const { error } = await supabase
      .from("prices")
      .delete()
      .eq("stripe_price_id", stripePriceId);

    if (error) {
      console.error("Error deleting price:", error);
    } else {
      console.log(`Price ${stripePriceId} deleted successfully`);
    }
  } catch (error) {
    console.error("Error in handlePriceDelete:", error);
  }
}

async function handleCustomerCreated(customerData: Record<string, unknown>) {
  try {
    const metadata = customerData.metadata as Record<string, string> | undefined;
    const userId = metadata?.user_id;

    if (userId) {
      const { error } = await supabase
        .from("student_profiles")
        .update({
          stripe_customer_id: customerData.id as string,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", userId);

      if (error) {
        console.error("Error updating customer:", error);
      } else {
        console.log(`Customer ${customerData.id} linked to user ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error in handleCustomerCreated:", error);
  }
}

async function handleCustomerUpdated(customerData: Record<string, unknown>) {
  try {
    const { error } = await supabase
      .from("student_profiles")
      .update({
        default_payment_method_details: {
          name: customerData.name,
          email: customerData.email,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerData.id as string);

    if (error) {
      console.error("Error updating customer info:", error);
    } else {
      console.log(`Customer ${customerData.id} updated successfully`);
    }
  } catch (error) {
    console.error("Error in handleCustomerUpdated:", error);
  }
}

async function handleSubscriptionCreated(
  subscriptionData: Record<string, unknown>
) {
  try {
    // Get price information from subscription items
    const items = subscriptionData.items as {
      data: Array<{ price: { id: string } }>;
    };
    const stripePriceId = items.data[0]?.price?.id;

    if (!stripePriceId) {
      console.error("No price ID found in subscription items");
      return;
    }

    console.log(`Creating subscription ${subscriptionData.id} for customer ${subscriptionData.customer}`);
    
    // Use the new database function to handle subscription creation
    const { error } = await supabase.rpc("upsert_stripe_subscription", {
      p_stripe_subscription_id: subscriptionData.id as string,
      p_stripe_customer_id: subscriptionData.customer as string,
      p_stripe_price_id: stripePriceId,
      p_subscription_data: subscriptionData,
    });

    if (error) {
      console.error("Error creating subscription:", error);
      return;
    }

    console.log(`Subscription ${subscriptionData.id} created successfully`);
  } catch (error) {
    console.error("Error in handleSubscriptionCreated:", error);
  }
}

async function handleSubscriptionUpdated(
  subscriptionData: Record<string, unknown>
) {
  try {
    // Get price information from subscription items
    const items = subscriptionData.items as {
      data: Array<{ price: { id: string } }>;
    };
    const stripePriceId = items.data[0]?.price?.id;

    if (!stripePriceId) {
      console.error("No price ID found in subscription items");
      return;
    }

    console.log(`Updating subscription ${subscriptionData.id} for customer ${subscriptionData.customer}`);
    
    // Use the same database function to handle subscription updates
    const { error } = await supabase.rpc("upsert_stripe_subscription", {
      p_stripe_subscription_id: subscriptionData.id as string,
      p_stripe_customer_id: subscriptionData.customer as string,
      p_stripe_price_id: stripePriceId,
      p_subscription_data: subscriptionData,
    });

    if (error) {
      console.error("Error updating subscription:", error);
      return;
    }

    console.log(`Subscription ${subscriptionData.id} updated successfully`);
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
  }
}

async function handleSubscriptionDeleted(
  subscriptionData: Record<string, unknown>
) {
  try {
    // Get the user profile associated with this subscription
    const { data: subscription } = await supabase
      .from("student_subscriptions")
      .select("profile_id")
      .eq("stripe_subscription_id", subscriptionData.id as string)
      .single();

    if (!subscription) {
      console.error("Subscription not found in database:", subscriptionData.id);
      return;
    }

    // Update subscription record
    const { error: subError } = await supabase
      .from("student_subscriptions")
      .update({
        status: "canceled",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionData.id as string);

    if (subError) {
      console.error("Error updating canceled subscription:", subError);
      return;
    }

    // Use database function to recalculate user's tier based on remaining subscriptions
    const { error: tierError } = await supabase.rpc(
      "update_user_subscription_tier",
      {
        user_profile_id: subscription.profile_id,
      }
    );

    if (tierError) {
      console.error("Error updating subscription tier:", tierError);
    } else {
      console.log(
        `User ${subscription.profile_id} tier recalculated after subscription deletion`
      );
    }

    console.log(`Subscription ${subscriptionData.id} deleted successfully`);
  } catch (error) {
    console.error("Error in handleSubscriptionDeleted:", error);
  }
}

async function handleInvoicePaymentSucceeded(
  invoiceData: Record<string, unknown>
) {
  try {
    const metadata = invoiceData.metadata as Record<string, string> | undefined;
    const isAudiobookPurchase = metadata?.type === 'audiobook_purchase';
    
    if (isAudiobookPurchase) {
      // Handle audiobook purchase
      console.log(`Processing audiobook purchase invoice ${invoiceData.id}`);
      
      const { error } = await supabase.rpc("upsert_audiobook_purchase", {
        p_stripe_invoice_id: invoiceData.id as string,
        p_stripe_customer_id: invoiceData.customer as string,
        p_invoice_data: {
          ...invoiceData,
          status: "paid",
        },
      });

      if (error) {
        console.error("Error processing audiobook purchase:", error);
      } else {
        console.log(`Audiobook purchase ${invoiceData.id} recorded successfully`);
      }
    } else {
      // Handle subscription invoice
      let subscriptionId = (invoiceData.subscription as string) || "";
      
      // If no subscription ID in invoice, try to find active subscription for customer
      if (!subscriptionId) {
        const { data: activeSubscription } = await supabase
          .from("student_subscriptions")
          .select(`
            stripe_subscription_id,
            student_profiles!inner(stripe_customer_id)
          `)
          .eq("student_profiles.stripe_customer_id", invoiceData.customer as string)
          .in("status", ["active", "trialing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        if (activeSubscription?.stripe_subscription_id) {
          subscriptionId = activeSubscription.stripe_subscription_id;
          console.log(`Found active subscription ${subscriptionId} for customer ${invoiceData.customer}`);
        }
      }
      
      console.log(`Processing subscription invoice ${invoiceData.id} with subscription_id: ${subscriptionId || 'NULL'}`);
      
      // Use the existing database function to handle invoice upsert
      const { error } = await supabase.rpc("upsert_stripe_invoice", {
        p_stripe_invoice_id: invoiceData.id as string,
        p_stripe_customer_id: invoiceData.customer as string,
        p_stripe_subscription_id: subscriptionId,
        p_invoice_data: {
          ...invoiceData,
          status: "paid", // Override status for successful payment
        },
      });

      if (error) {
        console.error("Error creating/updating subscription invoice:", error);
      } else {
        console.log(`Subscription invoice ${invoiceData.id} payment recorded successfully`);
      }
    }
  } catch (error) {
    console.error("Error in handleInvoicePaymentSucceeded:", error);
  }
}

async function handleInvoicePaymentFailed(
  invoiceData: Record<string, unknown>
) {
  try {
    let subscriptionId = (invoiceData.subscription as string) || "";
    
    // If no subscription ID in invoice, try to find active subscription for customer
    if (!subscriptionId) {
      const { data: activeSubscription } = await supabase
        .from("student_subscriptions")
        .select(`
          stripe_subscription_id,
          student_profiles!inner(stripe_customer_id)
        `)
        .eq("student_profiles.stripe_customer_id", invoiceData.customer as string)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
      if (activeSubscription?.stripe_subscription_id) {
        subscriptionId = activeSubscription.stripe_subscription_id;
        console.log(`Found active subscription ${subscriptionId} for customer ${invoiceData.customer}`);
      }
    }
    
    console.log(`Processing failed invoice ${invoiceData.id} with subscription_id: ${subscriptionId || 'NULL'}`);
    
    // Use the new database function to handle invoice upsert
    const { error } = await supabase.rpc("upsert_stripe_invoice", {
      p_stripe_invoice_id: invoiceData.id as string,
      p_stripe_customer_id: invoiceData.customer as string,
      p_stripe_subscription_id: subscriptionId,
      p_invoice_data: {
        ...invoiceData,
        status: "past_due", // Override status for failed payment
      },
    });

    if (error) {
      console.error("Error updating failed invoice:", error);
    } else {
      console.log(`Invoice ${invoiceData.id} payment failure recorded`);
    }
  } catch (error) {
    console.error("Error in handleInvoicePaymentFailed:", error);
  }
}

async function handleCheckoutSessionCompleted(
  sessionData: Record<string, unknown>
) {
  try {
    const customerId = sessionData.customer as string;
    const subscriptionId = sessionData.subscription as string;
    const metadata = sessionData.metadata as Record<string, string> | undefined;
    const userId = metadata?.user_id;
    const isAudiobookPurchase = metadata?.type === 'audiobook_purchase';

    if (userId && customerId) {
      // Ensure the customer ID is saved to the user profile
      const { error } = await supabase
        .from("student_profiles")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", userId);

      if (error) {
        console.error("Error updating customer ID after checkout:", error);
      }
    }

    console.log(
      `Checkout session ${sessionData.id} completed for customer ${customerId}`
    );

    if (isAudiobookPurchase) {
      console.log(
        `Audiobook purchase checkout completed - invoice will be processed by invoice.payment_succeeded webhook`
      );
    } else if (subscriptionId) {
      console.log(
        `Subscription ${subscriptionId} will be processed by subscription.created webhook`
      );
    }
  } catch (error) {
    console.error("Error in handleCheckoutSessionCompleted:", error);
  }
}

/**
 * POST handler for Stripe webhook events
 * Logs all webhook events for analysis before implementing sync logic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SIGNING_SECRET not configured");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    if (!signature) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    const elements = signature.split(",");
    const signatureElements = elements.reduce((acc, element) => {
      const [key, value] = element.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${signatureElements.t}.${body}`, "utf8")
      .digest("hex");

    if (expectedSignature !== signatureElements.v1) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    // Parse the webhook event
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error("Invalid JSON in webhook body:", err);
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    // Log the webhook event
    console.log(`Stripe webhook: ${event.type} - ${event.id}`);

    // Handle different event types
    switch (event.type) {
      case "product.created":
      case "product.updated":
        await handleProductSync(event.data.object);
        break;

      case "product.deleted":
        await handleProductDelete(event.data.object.id);
        break;

      case "price.created":
      case "price.updated":
      case "plan.created":
      case "plan.updated":
        await handlePriceSync(event.data.object);
        break;

      case "price.deleted":
      case "plan.deleted":
        await handlePriceDelete(event.data.object.id);
        break;

      case "customer.created":
        await handleCustomerCreated(event.data.object);
        break;

      case "customer.updated":
        await handleCustomerUpdated(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
