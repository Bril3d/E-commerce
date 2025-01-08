import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  try {
    const { items, shippingAddress } = await request.json();
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch product details from Supabase
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', items.map((item: any) => item.id));

    if (productsError) throw productsError;

    // Calculate total amount
    const total = items.reduce((sum: number, item: any) => {
      const product = products?.find((p) => p.id === item.id);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    // Create order in Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          payment_status: 'pending',
          shipping_address: shippingAddress,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => {
      const product = products?.find((p) => p.id === item.id);
      return {
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: product?.price || 0,
      };
    });

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) throw orderItemsError;

    // Create line items for Stripe
    const lineItems = items.map((item: any) => {
      const product = products?.find((p) => p.id === item.id);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product?.name || 'Unknown Product',
            images: product?.image_url ? [product.image_url] : [],
          },
          unit_amount: Math.round((product?.price || 0) * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?canceled=true`,
      metadata: {
        order_id: order.id,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
