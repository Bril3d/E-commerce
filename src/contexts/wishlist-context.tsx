'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  category: {
    name: string;
  };
}

interface WishlistContextType {
  items: Product[];
  isLoading: boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setItems([]);
      setIsLoading(false);
    }
  }, [user]);

  async function fetchWishlist() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          product_id,
          product:products(
            id,
            name,
            description,
            price,
            image_url,
            category_id,
            category:categories(name)
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      setItems(data.map((item) => item.product));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlist',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function addItem(product: Product) {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your wishlist',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        product_id: product.id,
      });

      if (error) throw error;

      setItems((prev) => [...prev, product]);
      toast({
        title: 'Added to wishlist',
        description: `${product.name} has been added to your wishlist`,
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to wishlist',
        variant: 'destructive',
      });
    }
  }

  async function removeItem(productId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== productId));
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist',
        variant: 'destructive',
      });
    }
  }

  function isInWishlist(productId: string) {
    return items.some((item) => item.id === productId);
  }

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        removeItem,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
