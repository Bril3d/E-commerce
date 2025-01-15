'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CreditCard, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Address = Database['public']['Tables']['addresses']['Row'];
type OrderData = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    fetchAddresses();
  }, [user, items.length, router]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      setAddresses(data || []);
      if (data && data.length > 0) {
        const defaultAddress = data.find((addr: Address) => addr.is_default) || data[0];
        setSelectedAddress(defaultAddress.id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load addresses',
        variant: 'destructive',
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress) return;

    try {
      setLoading(true);

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_amount: total,
          shipping_address_id: selectedAddress,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error(orderError?.message || 'Failed to create order');
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      // Update product stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock_quantity: supabase.rpc('decrement_stock', {
              p_id: item.id,
              amount: item.quantity
            })
          })
          .eq('id', item.id);

        if (stockError) {
          throw new Error(stockError.message);
        }
      }

      // Clear cart and redirect to order confirmation
      clearCart();
      router.push(`/orders/${orderData.id}`);

      toast({
        title: 'Order Placed',
        description: 'Your order has been placed successfully!',
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    No shipping addresses found
                  </p>
                  <Button onClick={() => router.push('/account?tab=addresses')}>
                    Add Address
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedAddress}
                  onValueChange={setSelectedAddress}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        <div>
                          <div className="font-medium">{address.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {address.address}, {address.city}, {address.country}{' '}
                            {address.postal_code}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="h-auto py-4"
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Credit Card
                    </div>
                    {paymentMethod === 'card' && (
                      <Check className="h-5 w-5" />
                    )}
                  </div>
                </Button>
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="h-auto py-4"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      Cash on Delivery
                    </div>
                    {paymentMethod === 'cash' && (
                      <Check className="h-5 w-5" />
                    )}
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.name} × {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-muted-foreground">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={loading || !selectedAddress}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
