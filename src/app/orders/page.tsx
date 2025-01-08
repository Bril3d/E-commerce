'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { supabase, handleError } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

export default function OrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const data = await handleError(
        supabase
          .from('orders')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
      );

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start shopping to create your first order!
              </p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Order #{order.id}</CardTitle>
                      <CardDescription>
                        Placed on {format(new Date(order.created_at), 'PPp')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getOrderStatusIcon(order.status)}
                      <span className="capitalize font-medium">{order.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment Method:{' '}
                        {order.payment_method === 'card'
                          ? 'Credit Card'
                          : 'Cash on Delivery'}
                      </p>
                      <p className="font-medium mt-1">
                        Total: ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
