import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

interface AudiobookCheckoutRequest {
  book_id: number;
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { book_id, return_url, cancel_url }: AudiobookCheckoutRequest = await request.json();

    if (!book_id) {
      return NextResponse.json({ error: 'book_id is required' }, { status: 400 });
    }

    // Check if user already owns the audiobook
    const { data: existingPurchase } = await supabase
      .from('user_audiobook_purchases')
      .select('purchase_id')
      .eq('profile_id', user.id)
      .eq('book_id', book_id)
      .single();

    if (existingPurchase) {
      return NextResponse.json({ error: 'Audiobook already purchased' }, { status: 400 });
    }

    // Get audiobook information
    const { data: audiobook, error: audiobookError } = await supabase
      .from('audiobooks')
      .select('book_id, title, author, description, price_cents, is_active')
      .eq('book_id', book_id)
      .eq('is_active', true)
      .single();

    if (audiobookError || !audiobook) {
      return NextResponse.json({ error: 'Audiobook not found or not available for purchase' }, { status: 404 });
    }

    if (!audiobook.price_cents || audiobook.price_cents <= 0) {
      return NextResponse.json({ error: 'This audiobook is not available for purchase' }, { status: 400 });
    }

    // Get Stripe pricing information
    const { data: priceData, error: priceError } = await supabase
      .from('prices')
      .select(`
        stripe_price_id,
        active,
        products!inner(
          stripe_product_id,
          book_id
        )
      `)
      .eq('products.book_id', book_id)
      .eq('products.product_type', 'audiobook')
      .eq('active', true)
      .single();

    let stripePriceId = priceData?.stripe_price_id;

    // If no Stripe product/price exists, create them automatically
    if (priceError || !priceData) {
      console.log(`Creating Stripe product/price for audiobook ${book_id}`);
      
      try {
        // Create Stripe product
        const product = await stripe.products.create({
          name: `Audiobook: ${audiobook.title}`,
          description: audiobook.description || `${audiobook.title} by ${audiobook.author}`,
          metadata: {
            type: 'audiobook',
            book_id: audiobook.book_id.toString(),
            auto_created: 'true'
          }
        });

        // Create Stripe price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: audiobook.price_cents,
          currency: 'usd',
          metadata: {
            book_id: audiobook.book_id.toString(),
            type: 'audiobook',
            auto_created: 'true'
          }
        });

        // Store in database
        await supabase.from('products').insert({
          stripe_product_id: product.id,
          active: true,
          name: product.name,
          description: product.description,
          book_id: audiobook.book_id,
          product_type: 'audiobook',
          metadata: product.metadata
        });

        const { data: dbProduct } = await supabase
          .from('products')
          .select('id')
          .eq('stripe_product_id', product.id)
          .single();

        if (dbProduct) {
          await supabase.from('prices').insert({
            stripe_price_id: price.id,
            product_id: dbProduct.id,
            active: true,
            unit_amount: audiobook.price_cents,
            currency: 'usd',
            type: 'one_time',
            metadata: price.metadata
          });
        }

        stripePriceId = price.id;
        console.log(`Successfully created Stripe product/price for audiobook ${book_id}`);
      } catch (stripeError) {
        console.error('Error auto-creating Stripe product:', stripeError);
        return NextResponse.json({ 
          error: 'Unable to process payment for this audiobook. Please try again later.' 
        }, { status: 500 });
      }
    }

    if (!stripePriceId) {
      return NextResponse.json({ error: 'Unable to process payment for this audiobook' }, { status: 400 });
    }

    // Get user's profile and Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if they don't have one
    if (!customerId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name: userProfile 
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          : undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update the user's profile with the Stripe customer ID
      await supabase
        .from('student_profiles')
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', user.id);
    }

    // Get the correct base URL
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || request.nextUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;

    const defaultReturnUrl = `${baseUrl}/learn/audiobooks/${book_id}?purchased=true`;
    const defaultCancelUrl = `${baseUrl}/learn/audiobooks?canceled=true`;

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: return_url || defaultReturnUrl,
      cancel_url: cancel_url || defaultCancelUrl,
      metadata: {
        user_id: user.id,
        book_id: book_id.toString(),
        type: 'audiobook_purchase',
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: {
            user_id: user.id,
            book_id: book_id.toString(),
            type: 'audiobook_purchase',
          },
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Error creating audiobook checkout session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}