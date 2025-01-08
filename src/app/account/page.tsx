'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Bell,
  LogOut,
  ShoppingBag,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type Profile = Database['public']['Tables']['profiles']['Row'];
type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Array<{
    quantity: number;
    unit_price: number;
    product: {
      name: string;
      image_url: string;
    };
  }>;
};
type Address = Database['public']['Tables']['addresses']['Row'];

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchUserData();
  }, [user, router]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch profile
      const profileData = await handleError(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
      );

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
        });
      }

      // Fetch orders with items and products
      const ordersData = await handleError(
        supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              unit_price,
              product:products (
                name,
                image_url
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      );

      setOrders(ordersData || []);

      // Fetch addresses
      const addressesData = await handleError(
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
      );

      setAddresses(addressesData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load your account data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { full_name, phone } = profile;
      
      if (!full_name?.trim()) {
        throw new Error('Name is required');
      }

      await handleError(
        supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: full_name.trim(),
            phone: phone?.trim() || null,
            updated_at: new Date().toISOString(),
          })
      );

      await fetchUserData();
      
      toast({
        title: 'Success',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update your profile',
        variant: 'destructive',
      });
    }
  };

  const handleAddAddress = async (address: Omit<Address, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      // If this is the first address or marked as default, unset other default addresses
      if (address.is_default || addresses.length === 0) {
        await handleError(
          supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id)
        );
      }

      await handleError(
        supabase
          .from('addresses')
          .insert({
            ...address,
            user_id: user.id,
            is_default: address.is_default || addresses.length === 0,
          })
      );

      await fetchUserData();
      
      toast({
        title: 'Success',
        description: 'Address added successfully',
      });
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add address',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;

    try {
      await handleError(
        supabase
          .from('addresses')
          .delete()
          .eq('id', addressId)
          .eq('user_id', user.id)
      );

      await fetchUserData();
      
      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete address',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Account</h1>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="addresses">
            <MapPin className="h-4 w-4 mr-2" />
            Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                View and track your orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-6">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Order #{order.id.slice(0, 8)}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(order.created_at), 'PPP')}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${order.total_amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.status}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.order_items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4"
                          >
                            <div className="relative w-16 h-16">
                              <img
                                src={item.product.image_url || ''}
                                alt={item.product.name}
                                className="absolute inset-0 w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {item.product.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.full_name || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="Enter your phone number"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Addresses</CardTitle>
              <CardDescription>
                Manage your shipping addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-muted rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No addresses found</p>
                </div>
              ) : (
                addresses.map((address) => (
                  <Card key={address.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {address.name}
                          {address.is_default && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                              Default
                            </span>
                          )}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{address.address}</p>
                      <p>
                        {address.city}, {address.postal_code}
                      </p>
                      <p>{address.country}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
