
import CartView from '@/components/cart/CartView';

export const metadata = {
  title: 'Shopping Cart | AtoZdpolify',
  description: 'View and manage items in your shopping cart.',
};

export default function CartPage() {
  return (
    <div className="container"> {/* Removed main */}
      <h1 className="text-3xl md:text-4xl font-bold mb-8 md:mb-10 text-center text-foreground">Your Shopping Cart</h1>
      <CartView />
    </div>
  );
}
