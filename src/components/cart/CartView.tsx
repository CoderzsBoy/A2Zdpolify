
"use client";

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import CartItemCard from './CartItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ShoppingCart, Loader2, Tag, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export default function CartView() {
  const {
    cartItems,
    subTotal,
    grandTotal,
    discountAmount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    loadingCart,
    loadingCoupon
  } = useCart();
  const { currentUser, loading: authLoading } = useAuth();
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = async () => {
    if (couponCode.trim()) {
      await applyCoupon(couponCode.trim());
      setCouponCode(''); 
    }
  };

  if (authLoading) {
     return (
      <div className="text-center py-20">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Loading Cart...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <ShoppingCart className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">Your Cart is Hidden</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Please <Link href="/login" className="text-primary hover:underline font-medium">log in</Link> to view your cart and continue shopping.</p>
        <Button asChild size="lg">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (loadingCart && cartItems.length === 0) {
     return (
      <div className="text-center py-20">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Loading Your Cart Items...</h2>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <ShoppingCart className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">Your Cart is Empty</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Looks like you haven't added anything yet. Explore our products and find something you love!</p>
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 md:gap-10 items-start">
      <div className="lg:col-span-2 space-y-6">
        {cartItems.map((item) => (
          <CartItemCard key={item.cartItemId} item={item} />
        ))}
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg sticky top-24 border-border"> {/* Added sticky top-24 */}
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-grow"
                  disabled={loadingCoupon}
                />
                <Button onClick={handleApplyCoupon} disabled={loadingCoupon || !couponCode.trim()} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                  {loadingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-primary/10 rounded-md border border-primary/30 text-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-primary flex items-center">
                      <Tag className="h-4 w-4 mr-1.5" /> Coupon: {appliedCoupon.code}
                    </p>
                    <p className="text-primary/90">Saving ₹{discountAmount.toFixed(2)} ({appliedCoupon.discount}%)</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeCoupon} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">₹{subTotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span className="text-muted-foreground">Discount ({appliedCoupon.discount}%):</span>
                  <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-foreground">Grand Total:</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md" disabled={loadingCart || loadingCoupon || cartItems.length === 0}>
              <Link href="/checkout">
                {(loadingCart || loadingCoupon) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4"/>
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={clearCart} className="w-full" disabled={loadingCart || loadingCoupon}>
              {(loadingCart || loadingCoupon) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clear Cart
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
