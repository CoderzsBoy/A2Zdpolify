
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product, ProductImage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Heart, Eye, Download, Image as ImageIconLucide } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

const getDisplayImage = (images: ProductImage[] | undefined): string => {
  if (!images || images.length === 0) return 'https://placehold.co/600x450.png';
  const primaryImage = images.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : images[0].url;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  const displayImageUrl = getDisplayImage(product.images);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, undefined, displayImageUrl);
  };

  let typeSpecificIcon = null;
  if (product.productType === 'digital') {
    typeSpecificIcon = <Download className="h-3 w-3 mr-1" />;
  } else if (product.productType === 'customized') {
    typeSpecificIcon = <ImageIconLucide className="h-3 w-3 mr-1" />;
  }

  return (
    <Card className="group flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 h-full bg-card border border-border hover:border-primary/30">
      <CardHeader className="p-0 relative">
        <Link href={`/product/${product.id}`} className="block aspect-[4/3] overflow-hidden rounded-t-md">
          <Image
            src={displayImageUrl}
            alt={product.name}
            width={600}
            height={450}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.dataAiHint || 'product image'}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>
        <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-2.5 right-2.5 z-10 rounded-full bg-card/70 hover:bg-card text-muted-foreground w-8 h-8 shadow-md backdrop-blur-sm",
              isWishlisted(product.id) ? "text-destructive fill-destructive hover:text-destructive/90" : "hover:text-primary"
            )}
            aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-4 w-4", isWishlisted(product.id) && "fill-destructive text-destructive")} />
        </Button>
        {product.productType && (
          <Badge
              variant="secondary"
              className="absolute top-2.5 left-2.5 z-10 capitalize flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary/80 text-secondary-foreground shadow-sm backdrop-blur-sm"
          >
              {typeSpecificIcon}
              {product.productType}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-grow flex flex-col">
        <CardTitle className="text-sm sm:text-base font-semibold mb-1 leading-snug">
          <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors line-clamp-2 text-foreground">
            {product.name}
          </Link>
        </CardTitle>
        <div className="mt-auto pt-2">
            <p className="text-lg sm:text-xl font-bold text-primary mb-2 sm:mb-3">₹{product.price.toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col sm:flex-row gap-2 items-center">
        <Button
          onClick={handleAddToCart}
          className="w-full sm:flex-1 sm:min-w-0 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
          aria-label={`Add ${product.name} to cart`}
          size="sm"
        >
          <ShoppingCart className="mr-1.5 h-4 w-4" /> Add to Cart
        </Button>
        <Button variant="outline" asChild size="sm" className="w-full sm:w-auto sm:min-w-0 text-xs sm:text-sm">
          <Link href={`/product/${product.id}`} aria-label={`View ${product.name} details`}
            className="flex items-center justify-center"
          >
            <Eye className="mr-0 sm:mr-1.5 h-4 w-4" /> <span className="sm:inline hidden">View</span><span className="sm:hidden inline">View Details</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
