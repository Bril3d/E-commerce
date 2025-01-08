import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '@/lib/email';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            quantity,
            unit_price,
            product:products(
              name
            )
          ),
          user:users(
            email,
            user_metadata
          )
        `)
        .eq('id', session.metadata.order_id)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return NextResponse.json(
          { error: 'Error fetching order' },
          { status: 500 }
        );
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          payment_intent_id: session.payment_intent,
        })
        .eq('id', session.metadata.order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        return NextResponse.json(
          { error: 'Error updating order' },
          { status: 500 }
        );
      }

      // Send order confirmation email
      await sendOrderConfirmationEmail({
        orderNumber: order.id,
        customerName: order.user.user_metadata.full_name || 'Valued Customer',
        customerEmail: order.user.email,
        items: order.items.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        total: order.total_amount,
        shippingAddress: order.shipping_address,
      });

      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(
            email,
            user_metadata
          )
        `)
        .eq('payment_intent_id', paymentIntent.id)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return NextResponse.json(
          { error: 'Error fetching order' },
          { status: 500 }
        );
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'failed',
        })
        .eq('payment_intent_id', paymentIntent.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        return NextResponse.json(
          { error: 'Error updating order' },
          { status: 500 }
        );
      }

      // Send order status update email
      await sendOrderStatusEmail({
        orderNumber: order.id,
        customerName: order.user.user_metadata.full_name || 'Valued Customer',
        customerEmail: order.user.email,
        status: 'failed',
      });

      break;
    }
  }

  return NextResponse.json({ received: true });
}
