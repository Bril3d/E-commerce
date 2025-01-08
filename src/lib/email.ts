import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country: string;
    postal_code: string;
  };
}

export async function sendOrderConfirmationEmail({
  orderNumber,
  customerName,
  customerEmail,
  items,
  total,
  shippingAddress,
}: OrderEmailProps) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-details { margin-bottom: 30px; }
          .items { margin-bottom: 30px; }
          .item { margin-bottom: 10px; }
          .total { font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          
          <div class="order-details">
            <h2>Order #${orderNumber}</h2>
            <p>Hi ${customerName},</p>
            <p>We've received your order and it's being processed.</p>
          </div>

          <div class="items">
            <h3>Order Summary</h3>
            ${items
              .map(
                (item) => `
                <div class="item">
                  <p>${item.name} x ${item.quantity} - $${(
                  item.price * item.quantity
                ).toFixed(2)}</p>
                </div>
              `
              )
              .join('')}
            <div class="total">
              <p>Total: $${total.toFixed(2)}</p>
            </div>
          </div>

          <div class="shipping">
            <h3>Shipping Address</h3>
            <p>${shippingAddress.name}</p>
            <p>${shippingAddress.address}</p>
            <p>${shippingAddress.city}, ${shippingAddress.postal_code}</p>
            <p>${shippingAddress.country}</p>
          </div>

          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'orders@yourdomain.com',
      to: customerEmail,
      subject: `Order Confirmation #${orderNumber}`,
      html,
    });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
}

export async function sendOrderStatusEmail({
  orderNumber,
  customerName,
  customerEmail,
  status,
}: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
}) {
  const statusMessages = {
    processing: 'Your order is being processed and will be shipped soon.',
    shipped: 'Your order has been shipped and is on its way!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { margin-bottom: 30px; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your order #${orderNumber} has been updated.</p>
            <p>${statusMessages[status as keyof typeof statusMessages] || 'Your order status has been updated.'}</p>
          </div>

          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'orders@yourdomain.com',
      to: customerEmail,
      subject: `Order Status Update #${orderNumber}`,
      html,
    });
  } catch (error) {
    console.error('Error sending order status email:', error);
  }
}
