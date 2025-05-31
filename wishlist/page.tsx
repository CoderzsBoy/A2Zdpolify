
import WishlistView from '@/components/wishlist/WishlistView';

export const metadata = {
  title: 'Your Wishlist | AtoZdpolify',
  description: 'Manage your wishlisted products and discover your saved favorites.',
};

export default function WishlistPage() {
  return (
    <div className="container">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-10 text-center text-foreground">Your Wishlist</h1>
      <WishlistView />
    </div>
  );
}
