'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { emailService } from '@/lib/email';

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    country: string;
    postal_code: string;
  };
  items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product: {
      name: string;
      image_url: string;
    };
  }[];
  user: {
    email: string;
    user_metadata: {
      full_name: string;
    };
  };
}

const statusIcons = {
  pending: Clock,
  processing: Package,
  completed: CheckCircle,
  cancelled: XCircle,
  failed: AlertCircle,
};

const statusColors = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  completed: 'text-green-500',
  cancelled: 'text-red-500',
  failed: 'text-red-500',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          shipping_address:addresses(
            name,
            address,
            city,
            country,
            postal_code
          ),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            product:products(
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(order: Order, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (error) throw error;

      // Get user data from auth.users instead of the users table
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(order.user_id);

      if (userError) {
        console.error('Error fetching user:', userError);
        // Continue with order update even if we can't send the email
        await fetchOrders();
        return;
      }

      // Send order status update email if we have user data
      if (user) {
        await emailService.sendOrderStatus({
          orderNumber: order.id,
          customerName: user.user_metadata?.full_name || 'Valued Customer',
          customerEmail: user.email || '',
          status,
        });
      }

      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => {
          const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
          const statusColor = statusColors[order.status as keyof typeof statusColors];

          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'PPp')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-16 relative">
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="object-cover rounded"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Details */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-2">Shipping Address</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>{order.shipping_address.name}</p>
                        <p>{order.shipping_address.address}</p>
                        <p>
                          {order.shipping_address.city}, {order.shipping_address.postal_code}
                        </p>
                        <p>{order.shipping_address.country}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Order Summary</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Payment Status</span>
                          <span className="font-medium">{order.payment_status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Amount</span>
                          <span className="font-medium">
                            ${order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
