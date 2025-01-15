
type EmailData = {
  type: 'order_confirmation' | 'order_status' | 'newsletter';
  data: Record<string, any>;
};

async function sendEmail({ type, data }: EmailData) {
  const response = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return response.json();
}

export const emailService = {
  sendOrderConfirmation: (email: string, orderId: string, orderDetails: any) => 
    sendEmail({ 
      type: 'order_confirmation', 
      data: { email, orderId, ...orderDetails } 
    }),

  sendOrderStatus: (data: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: string;
  }) => sendEmail({ type: 'order_status', data }),

  sendNewsletterConfirmation: (email: string) =>
    sendEmail({ 
      type: 'newsletter', 
      data: { email } 
    })
};
