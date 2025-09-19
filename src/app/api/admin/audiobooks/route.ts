import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, author, description, language_code, level_code, points_cost, price_cents } = body;

    // Create audiobook in database first
    const { data: audiobook, error } = await supabase
      .from('audiobooks')
      .insert({
        title,
        author,
        description,
        language_code,
        level_code,
        points_cost: points_cost || 0,
        price_cents: price_cents || 0,
        duration_seconds: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create Stripe product and price if price_cents > 0
    let stripeProductId = null;
    let stripePriceId = null;

    if (price_cents && price_cents > 0) {
      try {
        // Create Stripe product
        const product = await stripe.products.create({
          name: `Audiobook: ${title}`,
          description: description || `${title} by ${author}`,
          metadata: {
            type: 'audiobook',
            book_id: audiobook.book_id.toString(),
            level: level_code,
            language: language_code
          }
        });

        // Create Stripe price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: price_cents,
          currency: 'usd',
          metadata: {
            book_id: audiobook.book_id.toString(),
            type: 'audiobook'
          }
        });

        stripeProductId = product.id;
        stripePriceId = price.id;

        // Store Stripe product in database
        await supabase.from('products').insert({
          stripe_product_id: product.id,
          active: true,
          name: product.name,
          description: product.description,
          book_id: audiobook.book_id,
          product_type: 'audiobook',
          metadata: product.metadata
        });

        // Store Stripe price in database
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
            unit_amount: price_cents,
            currency: 'usd',
            type: 'one_time',
            metadata: price.metadata
          });
        }
      } catch (stripeError) {
        console.error('Error creating Stripe product:', stripeError);
        // Don't fail the audiobook creation, just log the error
      }
    }

    return NextResponse.json({
      ...audiobook,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId
    });
  } catch (error) {
    console.error('Error creating audiobook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}