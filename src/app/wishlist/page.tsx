'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/wishlist-context';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, isLoading, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();

  useEffect(() => {
    if (!user) {
      router.push('/signin');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-4">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-4">
            Add items to your wishlist to keep track of products you're interested in.
          </p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <div
            key={product.id}
            className="group relative rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <Link
              href={`/products/${product.id}`}
              className="block aspect-square relative"
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
              />
            </Link>

            <div className="p-4">
              <Link
                href={`/products/${product.id}`}
                className="block group-hover:text-primary"
              >
                <h2 className="font-semibold mb-1 line-clamp-1">
                  {product.name}
                </h2>
              </Link>
              <p className="text-sm text-muted-foreground mb-2">
                {product.category.name}
              </p>
              <p className="font-bold mb-4">${product.price.toFixed(2)}</p>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => addToCart(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeItem(product.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
