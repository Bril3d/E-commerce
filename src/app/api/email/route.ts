import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Resend API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'order_confirmation':
        await resend.emails.send({
          from: 'orders@yourdomain.com',
          to: data.email,
          subject: `Order Confirmation #${data.orderId}`,
          html: `
            <h1>Thank you for your order!</h1>
            <p>Your order #${data.orderId} has been confirmed.</p>
          `
        });
        break;

      case 'order_status':
        await resend.emails.send({
          from: 'orders@yourdomain.com',
          to: data.customerEmail,
          subject: `Order Status Update #${data.orderNumber}`,
          html: `
            <h1>Order Status Update</h1>
            <p>Hi ${data.customerName},</p>
            <p>Your order #${data.orderNumber} has been updated to: ${data.status}</p>
          `
        });
        break;

      case 'newsletter':
        await resend.emails.send({
          from: 'newsletter@yourdomain.com',
          to: data.email,
          subject: 'Newsletter Subscription Confirmed',
          html: `
            <h1>Welcome to our newsletter!</h1>
            <p>Thank you for subscribing to our newsletter.</p>
          `
        });
        break;

      default:
        throw new Error('Invalid email type');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 