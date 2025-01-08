'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { supabase, handleError } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row'];
};
type Address = Database['public']['Tables']['addresses']['Row'];

export default function OrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [address, setAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchOrderDetails();
  }, [user, params.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order
      const orderData = await handleError(
        supabase
          .from('orders')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user?.id)
          .single()
      );

      if (!orderData) {
        throw new Error('Order not found');
      }

      setOrder(orderData);

      // Fetch order items with product details
      const { data: items } = await supabase
        .from('order_items')
        .select('*, products(*)')
        .eq('order_id', params.id);

      setOrderItems(items || []);

      // Fetch shipping address
      if (orderData.shipping_address_id) {
        const addressData = await handleError(
          supabase
            .from('addresses')
            .select('*')
            .eq('id', orderData.shipping_address_id)
            .single()
        );

        setAddress(addressData);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading order details...</div>
      </div>
    );
  }

  if (!order || !address) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-4">
            We couldn't find the order you're looking for.
          </p>
          <Button asChild>
            <Link href="/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'processing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Order #{params.id}</h1>
          <div className="flex items-center space-x-2">
            {getOrderStatusIcon(order.status)}
            <span className="capitalize font-medium">{order.status}</span>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <img
                        src={item.products.image_url || '/placeholder.png'}
                        alt={item.products.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="text-lg font-semibold hover:text-primary"
                      >
                        {item.products.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Price: ${item.unit_price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="font-medium">{address.name}</p>
                <p className="text-muted-foreground">
                  {address.address}
                  <br />
                  {address.city}, {address.country} {address.postal_code}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-muted-foreground">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Payment Method: {order.payment_method === 'card' ? 'Credit Card' : 'Cash on Delivery'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
