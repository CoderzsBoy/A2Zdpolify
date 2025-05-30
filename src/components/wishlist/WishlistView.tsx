
"use client";

import { useWishlist } from '@/contexts/WishlistContext';
import WishlistItemCard from './WishlistItemCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heart, Loader2, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
import { useAuth } from '@/contexts/AuthContext';

export default function WishlistView() {
  const { wishlistItems, loadingWishlist } = useWishlist();
  const { currentUser, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
     <div className="text-center py-20">
       <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
       <h2 className="text-2xl font-semibold mb-2 text-foreground">Loading Wishlist...</h2>
     </div>
   );
 }

  if (!currentUser) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <Heart className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">Your Wishlist Awaits</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Please <Link href="/login" className="text-primary hover:underline font-medium">log in</Link> to view your wishlist and save your favorite items.</p>
        <Button asChild size="lg">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }
  
  if (loadingWishlist && wishlistItems.length === 0) {
     return (
      <div className="text-center py-20">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Loading Your Wishlist Items...</h2>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <Heart className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">Your Wishlist is Empty</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Add your favorite products to your wishlist to see them here. Start exploring now!</p>
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/"><ShoppingBag className="mr-2 h-5 w-5"/>Discover Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto"> {/* Centered content and added max-width */}
      {wishlistItems.map((item) => (
        <WishlistItemCard key={item.wishlistItemId} item={item} />
      ))}
    </div>
  );
}
