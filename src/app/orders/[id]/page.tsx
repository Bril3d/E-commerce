'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  total_amount: number;
  tracking_number?: string;
  estimated_delivery?: string;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    country: string;
    postal_code: string;
  };
  items: OrderItem[];
  tracking_updates: {
    status: string;
    location: string;
    timestamp: string;
  }[];
}

const statusSteps = [
  { status: 'pending', icon: Clock, label: 'Order Placed' },
  { status: 'processing', icon: Package, label: 'Processing' },
  { status: 'shipped', icon: Truck, label: 'Shipped' },
  { status: 'delivered', icon: CheckCircle2, label: 'Delivered' },
];

export default function OrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
    fetchOrder();
  }, [user, params.id]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            quantity,
            unit_price,
            product:products(
              name,
              image_url
            )
          ),
          shipping_address:addresses(
            name,
            address,
            city,
            country,
            postal_code
          ),
          tracking_updates:order_tracking(
            status,
            location,
            timestamp
          )
        `)
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/account');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Button asChild>
            <Link href="/account">Back to Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(
    (step) => step.status === order.status
  );

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-8">
          {/* Order Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Order #{order.id}</h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.created_at), 'PPp')}
            </p>
          </div>

          {/* Order Status */}
          <div className="relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -translate-y-1/2" />
            <div className="relative z-10 flex justify-between">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isComplete = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.status}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`mt-2 text-sm ${
                        isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Information */}
          {order.tracking_number && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-semibold">Tracking Number</h2>
                  <p className="text-sm text-muted-foreground">
                    {order.tracking_number}
                  </p>
                </div>
                {order.estimated_delivery && (
                  <div className="text-right">
                    <h2 className="font-semibold">Estimated Delivery</h2>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.estimated_delivery), 'PPP')}
                    </p>
                  </div>
                )}
              </div>

              {order.tracking_updates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Tracking Updates</h3>
                  <div className="space-y-3">
                    {order.tracking_updates.map((update, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="w-5 h-5 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{update.status}</p>
                          <p className="text-muted-foreground">
                            {update.location} •{' '}
                            {format(new Date(update.timestamp), 'PPp')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <div className="w-20 h-20 relative">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="absolute inset-0 w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                    </p>
                    <p className="font-medium mt-1">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="p-4 border rounded-lg">
              <p className="font-medium">{order.shipping_address.name}</p>
              <p className="text-muted-foreground">
                {order.shipping_address.address}
                <br />
                {order.shipping_address.city}, {order.shipping_address.postal_code}
                <br />
                {order.shipping_address.country}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
