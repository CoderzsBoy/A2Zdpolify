
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
  if (!images || images.length === 0) return 'https://placehold.co/600x450/E0E7FF/4F46E5?text=Image'; // Updated placeholder
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
    typeSpecificIcon = <Download className="h-3.5 w-3.5 mr-1.5" />;
  } else if (product.productType === 'customized') {
    typeSpecificIcon = <ImageIconLucide className="h-3.5 w-3.5 mr-1.5" />;
  }

  return (
    <Card className="group flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 h-full bg-card border border-border hover:border-primary/50 transform hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        <Link href={`/product/${product.id}`} className="block aspect-[4/3] overflow-hidden rounded-t-lg">
          <Image
            src={displayImageUrl}
            alt={product.name}
            width={600}
            height={450}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            data-ai-hint={product.dataAiHint || 'product image'}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>
        <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-3 right-3 z-10 rounded-full bg-card/80 hover:bg-card text-muted-foreground w-9 h-9 shadow-md backdrop-blur-sm transition-colors duration-200",
              isWishlisted(product.id) ? "text-destructive fill-destructive hover:text-destructive/90" : "hover:text-primary"
            )}
            aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-5 w-5", isWishlisted(product.id) && "fill-destructive text-destructive")} />
        </Button>
        {product.productType && (
          <Badge
              variant="secondary"
              className="absolute top-3 left-3 z-10 capitalize flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary/90 text-secondary-foreground shadow-sm backdrop-blur-sm border-secondary-foreground/20"
          >
              {typeSpecificIcon}
              {product.productType}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-5 flex-grow flex flex-col">
        <CardTitle className="text-base sm:text-lg font-semibold mb-1.5 leading-tight">
          <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors line-clamp-2 text-foreground">
            {product.name}
          </Link>
        </CardTitle>
        <div className="mt-auto pt-2.5">
            <p className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4">₹{product.price.toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 sm:p-5 pt-0 flex flex-col sm:flex-row gap-2.5 items-center bg-muted/30 rounded-b-lg">
        <Button
          onClick={handleAddToCart}
          className="w-full sm:flex-1 sm:min-w-0 bg-accent hover:bg-accent/90 text-accent-foreground text-sm shadow-md hover:shadow-lg transition-all duration-200 py-2.5 rounded-md"
          aria-label={`Add ${product.name} to cart`}
          size="default" 
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
        <Button variant="outline" asChild size="default" className="w-full sm:w-auto sm:min-w-0 text-sm border-primary/50 text-primary hover:bg-primary/10 hover:text-primary rounded-md py-2.5">
          <Link href={`/product/${product.id}`} aria-label={`View ${product.name} details`}
            className="flex items-center justify-center"
          >
            <Eye className="mr-0 sm:mr-2 h-4 w-4" /> <span className="sm:inline hidden">View</span><span className="sm:hidden inline">View Details</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
