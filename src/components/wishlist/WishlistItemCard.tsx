
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { WishlistItem, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart, Loader2 } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';

interface WishlistItemCardProps {
  item: Product; // Corrected: WishlistItem now directly uses Product type definition
}

export default function WishlistItemCard({ item }: WishlistItemCardProps) {
  const { removeFromWishlist, loadingWishlist } = useWishlist();
  const { addToCart, loadingCart } = useCart();

  const handleMoveToCart = async () => {
    await addToCart(item); 
    await removeFromWishlist(item.id); 
  };

  const handleRemove = async () => {
    await removeFromWishlist(item.id); 
  };

  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 shadow-sm border-border relative overflow-hidden hover:shadow-md transition-shadow">
       {(loadingWishlist || loadingCart) && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded-lg">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        </div>
      )}
      <Link href={`/product/${item.id}`} className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
        <Image
          src={item.images[0]?.url || 'https://placehold.co/120x120.png'} // Use first image from array
          alt={item.name}
          width={120}
          height={120}
          className="rounded-md object-cover aspect-square border border-muted bg-muted"
          data-ai-hint={item.dataAiHint || 'product thumbnail'}
          sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
        />
      </Link>
      <div className="flex-grow self-start sm:self-center w-full sm:w-auto">
        <Link href={`/product/${item.id}`} className="hover:text-primary transition-colors">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground line-clamp-2">{item.name}</h3>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Price: ₹{item.price.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Category: {item.category}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto mt-2 sm:mt-0 w-full sm:w-auto">
        <Button onClick={handleMoveToCart} className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10" disabled={loadingWishlist || loadingCart} size="sm">
          <ShoppingCart className="mr-1.5 h-4 w-4" /> Move to Cart
        </Button>
        <Button variant="outline" size="sm" onClick={handleRemove} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10" aria-label="Remove from wishlist" disabled={loadingWishlist}>
          <X className="mr-1.5 h-4 w-4" /> Remove
        </Button>
      </div>
    </Card>
  );
}
