'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Minus, Plus, Heart, ShoppingCart } from 'lucide-react';
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
import { useCart } from '@/contexts/cart-context';
import { useWishlist } from '@/contexts/wishlist-context';
import { supabase, handleError } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'] & {
  category: {
    name: string;
  };
};

type Review = Database['public']['Tables']['reviews']['Row'] & {
  profiles: {
    full_name: string | null;
  };
};

export default function ProductPage() {
  const params = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      // Fetch product with category
      const productData = await handleError(
        supabase
          .from('products')
          .select('*, category:categories(name)')
          .eq('id', params.id)
          .single()
      );

      if (!productData) {
        throw new Error('Product not found');
      }

      setProduct(productData);

      // Fetch reviews with user profiles
      const reviewsData = await handleError(
        supabase
          .from('reviews')
          .select('*, profiles(full_name)')
          .eq('product_id', params.id)
          .order('created_at', { ascending: false })
      );

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem(product, quantity);
    toast({
      title: 'Added to Cart',
      description: `${quantity} × ${product.name} added to your cart`,
    });
  };

  const handleAddToWishlist = () => {
    if (!product) return;

    addToWishlist(product);
    toast({
      title: 'Added to Wishlist',
      description: `${product.name} added to your wishlist`,
    });
  };

  if (loading) {
    return (
      <div className="container py-8 px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="animate-pulse">
            <div className="aspect-square bg-muted rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground">
            The product you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="relative aspect-square">
          <img
            src={product.image_url || '/placeholder.png'}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground">{product.category.name}</p>
          </div>

          <div>
            <p className="text-3xl font-bold mb-4">${product.price.toFixed(2)}</p>
            {product.stock_quantity < 10 && (
              <p className="text-sm text-red-500">
                Only {product.stock_quantity} left in stock
              </p>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= product.stock_quantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleAddToWishlist}
            >
              <Heart
                className={`h-5 w-5 ${
                  isInWishlist(product.id)
                    ? 'fill-primary text-primary'
                    : 'text-foreground'
                }`}
              />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-muted-foreground">
                out of 5 • {reviews.length} reviews
              </div>
            </div>

            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {review.profiles.full_name || 'Anonymous'}
                        </CardTitle>
                        <CardDescription>
                          {new Date(review.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        <span className="font-bold mr-1">{review.rating}</span>
                        <span className="text-muted-foreground">/ 5</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
