
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Order } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSimulationPage() {
  const router = useRouter();
  const { clearCart, appliedCoupon } = useCart(); // Get appliedCoupon from useCart
  const { toast } = useToast();
  const [tempOrderData, setTempOrderData] = useState<Omit<Order, 'id' | 'createdAt'> & { createdAt?: Timestamp } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedOrderData = sessionStorage.getItem('tempOrderData');
      if (storedOrderData) {
        const parsedData = JSON.parse(storedOrderData);
        setTempOrderData(parsedData);
      } else {
        setError('No order data found. Please try checking out again.');
        toast({ title: "Error", description: "Order details missing. Redirecting to cart.", variant: "destructive" });
        router.replace('/cart');
      }
    } catch (e) {
        setError('Failed to load order data. Please try checking out again.');
        toast({ title: "Error", description: "Invalid order data. Redirecting to cart.", variant: "destructive" });
        console.error("Error parsing tempOrderData from sessionStorage:", e);
        router.replace('/cart');
    }
  }, [router, toast]);

  const incrementCouponUsage = async (couponId: string) => {
    const couponRef = doc(db, 'coupons', couponId);
    try {
      await updateDoc(couponRef, {
        timesUsed: increment(1)
      });
      console.log(`Coupon ${couponId} timesUsed incremented.`);
    } catch (error) {
      console.error(`Failed to increment timesUsed for coupon ${couponId}:`, error);
      // Optionally, notify admin or log this error more formally
    }
  };

  const handleSimulatePayment = async () => {
    if (!tempOrderData) {
      toast({ title: "Error", description: "Cannot process payment without order data.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create the order in Firestore
      const orderPayload: Omit<Order, 'id'> = {
        ...tempOrderData,
        status: 'Paid', // Update status to Paid
        paymentMethod: 'Online Payment', // Confirm payment method
        createdAt: serverTimestamp() as Timestamp, // Set actual creation timestamp
      };

      const docRef = await addDoc(collection(db, 'orders'), orderPayload);

      if (appliedCoupon) { // Check if a coupon was applied to this order
        await incrementCouponUsage(appliedCoupon.id);
      }

      await clearCart();
      sessionStorage.removeItem('tempOrderData');

      toast({
        title: "Payment Successful!",
        description: `Your order ID is ${docRef.id}. Items will be processed shortly.`,
      });
      router.push(`/order-confirmation/${docRef.id}?payment=success`);

    } catch (err) {
      console.error("Error processing payment or creating order:", err);
      setError('An error occurred while processing your payment. Please try again.');
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment or creating the order.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (error && !tempOrderData) {
    return (
         <main className="container flex flex-col items-center justify-center min-h-[70vh] py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
                    <CardTitle>Payment Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error}</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/cart')} className="w-full">Return to Cart</Button>
                </CardFooter>
            </Card>
        </main>
    );
  }

  if (!tempOrderData && !error) {
     return (
      <main className="container flex justify-center items-center py-20 min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading payment details...</p>
      </main>
    );
  }


  return (
    <main className="container flex items-center justify-center py-12 min-h-[70vh]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <CardTitle className="text-2xl font-bold">Simulate Payment</CardTitle>
          <CardDescription>
            This is a simulated payment page. No real transaction will occur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tempOrderData && (
            <div className="text-sm p-4 border rounded-md bg-muted/50">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <p>Total Items: {tempOrderData.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
              <p>Grand Total: <span className="font-bold text-primary">₹{tempOrderData.grandTotal.toFixed(2)}</span></p>
              {tempOrderData.appliedCoupon && <p>Coupon Applied: {tempOrderData.appliedCoupon.code}</p>}
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleSimulatePayment}
            className="w-full"
            disabled={isProcessing || !tempOrderData}
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              'Simulate Successful Payment'
            )}
          </Button>
          <Button variant="outline" onClick={() => router.push('/checkout')} className="w-full" disabled={isProcessing}>
            Cancel Payment
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
