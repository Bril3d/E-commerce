import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = subscribeSchema.parse(body);

    // Check if email already exists
    const { data: existingSubscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingSubscriber) {
      return NextResponse.json(
        { error: 'Email already subscribed' },
        { status: 400 }
      );
    }

    // Add subscriber to database
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email, name }]);

    if (dbError) throw dbError;

    // Send welcome email
    await resend.emails.send({
      from: 'E-Commerce <noreply@yourdomain.com>',
      to: email,
      subject: 'Welcome to Our Newsletter!',
      html: `
        <div>
          <h1>Welcome to Our Newsletter!</h1>
          <p>Dear ${name || 'Subscriber'},</p>
          <p>Thank you for subscribing to our newsletter! You'll now receive updates about:</p>
          <ul>
            <li>New product launches</li>
            <li>Exclusive deals and promotions</li>
            <li>Shopping tips and trends</li>
            <li>Company news and updates</li>
          </ul>
          <p>Stay tuned for our next update!</p>
          <p>Best regards,<br>The E-Commerce Team</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}
