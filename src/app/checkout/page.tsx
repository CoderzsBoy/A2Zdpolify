
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Loader2, ShoppingBag, CreditCard, Info, ArrowLeft, Image as ImageIconLucide, Type, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CheckoutFormData, OrderItem as OrderItemType, Order, CartItem, Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const createCheckoutFormSchema = (isOrderPhysical: boolean) => {
  return z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).regex(/^\+?[0-9\s-()]{10,20}$/, "Invalid phone number format."),
    addressLine: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().regex(/^\d{5,10}(?:[-\s]\d{4})?$/, "Invalid zip code format.").optional(),
  }).superRefine((data, ctx) => {
    if (isOrderPhysical) {
      if (!data.addressLine || data.addressLine.trim().length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A valid Address (Road Name/Area/Colony) is required.", path: ['addressLine'] });
      }
      if (!data.state || data.state.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "State/Province is required.", path: ['state'] });
      }
      if (!data.zipCode || data.zipCode.trim().length < 3 || !/^\d{3,10}(?:[-\s]\d{4})?$/.test(data.zipCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A valid Zip/Postal code is required.", path: ['zipCode'] });
      }
    }
  });
};


export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cartItems, subTotal, grandTotal, discountAmount, appliedCoupon, clearCart, loadingCart } = useCart();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOrderPhysical = useMemo(() => cartItems.some(item => item.productType === 'physical' || item.productType === 'customized'), [cartItems]);
  const isPurelyDigitalOrder = useMemo(() => cartItems.length > 0 && cartItems.every(item => item.productType === 'digital'), [cartItems]);

  const paymentMethod = isPurelyDigitalOrder || cartItems.some(item => item.productType === 'digital') ? 'Online Payment' : 'Cash on Delivery';

  const formSchema = useMemo(() => createCheckoutFormSchema(isOrderPhysical), [isOrderPhysical]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      addressLine: '',
      state: '',
      zipCode: '',
    },
  });

  useEffect(() => {
    if (!loadingCart && cartItems.length === 0 && !isSubmitting) {
      toast({
        title: "Cart is Empty",
        description: "Redirecting you to the shop...",
        variant: "destructive"
      });
      router.replace('/');
    }
  }, [cartItems, loadingCart, router, toast, isSubmitting]);

  useEffect(() => {
    if (currentUser) {
      form.reset({
        name: currentUser.displayName || form.getValues().name || '',
        email: currentUser.email || form.getValues().email || '',
        phone: currentUser.phoneNumber || form.getValues().phone || '', // Use Firebase Auth phone if available
        addressLine: form.getValues().addressLine || '',
        state: form.getValues().state || '',
        zipCode: form.getValues().zipCode || '',
      });
    }
  }, [currentUser, form, cartItems]);


  const incrementCouponUsage = async (couponId: string) => {
    const couponRef = doc(db, 'coupons', couponId);
    try {
      await updateDoc(couponRef, {
        timesUsed: increment(1)
      });
      console.log(`Coupon ${couponId} timesUsed incremented.`);
    } catch (error) {
      console.error(`Failed to increment timesUsed for coupon ${couponId}:`, error);
    }
  };


  const onSubmit = async (data: CheckoutFormData) => {
    if (cartItems.length === 0) {
      toast({ title: "Error", description: "Your cart is empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const orderItems: OrderItemType[] = cartItems.map((item: CartItem) => {
      const currentItem: OrderItemType = {
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        customization: item.customization || null,
        productType: item.productType,
      };

      if (item.productType === 'digital' && item.downloadUrl) {
        currentItem.downloadUrl = item.downloadUrl;
      }
      return currentItem;
    });

    const customerInfoPayload: CheckoutFormData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
    };

    if (isOrderPhysical) {
        customerInfoPayload.addressLine = data.addressLine || '';
        customerInfoPayload.state = data.state || '';
        customerInfoPayload.zipCode = data.zipCode || '';
    }

    const orderData: Omit<Order, 'id'> = {
      userId: currentUser?.uid || null,
      customerInfo: customerInfoPayload,
      items: orderItems,
      subTotal,
      discountAmount,
      grandTotal,
      appliedCoupon: appliedCoupon ? { id: appliedCoupon.id, code: appliedCoupon.code, discount: appliedCoupon.discount } : null,
      paymentMethod: paymentMethod,
      status: paymentMethod === 'Online Payment' ? 'Pending Payment' : 'Pending',
      createdAt: serverTimestamp() as Timestamp,
    };

    if (paymentMethod === 'Online Payment') {
      try {
        sessionStorage.setItem('tempOrderData', JSON.stringify(orderData));
        router.push('/payment-simulation');
      } catch (e) {
        toast({ title: "Error", description: "Could not proceed to payment. Please try again.", variant: "destructive" });
        setIsSubmitting(false);
      }
    } else {
      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        if (appliedCoupon) {
          await incrementCouponUsage(appliedCoupon.id);
        }
        await clearCart();
        toast({
          title: "Order Placed Successfully!",
          description: `Your order ID is ${docRef.id}. You will receive a confirmation shortly.`,
          duration: 5000,
          variant: "default", // Explicitly set for success
          className: "bg-green-500 text-white border-green-600", // Custom success styling
          action: <CheckCircle className="text-white" />
        });
        router.push(`/order-confirmation/${docRef.id}`);
      } catch (error) {
        console.error("Error placing order: ", error);
        toast({
          title: "Order Placement Failed",
          description: "There was an issue placing your order. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    }
  };

  if (loadingCart && cartItems.length === 0) {
    return (
      <div className="container flex justify-center items-center py-24 md:py-32 min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!loadingCart && cartItems.length === 0 && !isSubmitting) {
    return (
         <div className="container flex flex-col items-center justify-center py-24 md:py-32 min-h-[calc(100vh-15rem)] text-center">
            <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-6" />
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-md">Add some amazing products to your cart to proceed to checkout.</p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/">Explore Products</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <Button variant="outline" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
          <Link href="/cart"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Cart</Link>
        </Button>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 md:mb-12 text-center text-foreground">Secure Checkout</h1>
      
      <div className="grid lg:grid-cols-5 gap-8 md:gap-12 items-start">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="lg:col-span-3 space-y-6 md:space-y-8">
            <Card className="shadow-xl border-border rounded-lg">
              <CardHeader className="p-5 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">Contact Information</CardTitle>
                 {!isOrderPhysical && isPurelyDigitalOrder && (
                     <CardDescription className="text-sm pt-1">Please provide your contact details for your digital order.</CardDescription>
                 )}
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} disabled={!!currentUser?.email} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+91 12345 67890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {isOrderPhysical && (
              <Card className="shadow-xl border-border rounded-lg">
                <CardHeader className="p-5 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl">Shipping Address</CardTitle>
                    <CardDescription className="text-sm pt-1">Enter the address where your items will be delivered.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-5">
                    <FormField
                      control={form.control}
                      name="addressLine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Road Name/Area/Colony)</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St / Downtown / Green Valley" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                                <Input placeholder="California" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Zip / Postal Code</FormLabel>
                            <FormControl>
                                <Input placeholder="90210" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </CardContent>
              </Card>
            )}

            {!isOrderPhysical && isPurelyDigitalOrder && (
                <Alert variant="default" className="mt-6 bg-primary/10 border-primary/30 text-primary">
                    <Info className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary/90 font-semibold">Digital Order</AlertTitle>
                    <AlertDescription className="text-sm">Shipping details are not required for orders containing only digital products.</AlertDescription>
                </Alert>
            )}

            <Card className="shadow-xl border-border rounded-lg">
                <CardHeader className="p-5 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl">Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                    {paymentMethod === 'Online Payment' ? (
                        <div className="p-4 border rounded-lg bg-secondary/50 text-secondary-foreground">
                            <p className="font-semibold text-base">Online Payment</p>
                            <p className="text-sm text-muted-foreground mt-1">Digital products or mixed carts require online payment. You'll be redirected to our secure payment simulation.</p>
                        </div>
                    ) : (
                        <div className="p-4 border rounded-lg bg-secondary/50 text-secondary-foreground">
                            <p className="font-semibold text-base">Cash on Delivery (COD)</p>
                            <p className="text-sm text-muted-foreground mt-1">Pay with cash when your order is delivered (available for physical items only).</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-5 sm:p-6 border-t">
                    <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-base" disabled={isSubmitting || cartItems.length === 0}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> :
                     (paymentMethod === 'Online Payment' ? <><CreditCard className="mr-2 h-5 w-5" />Proceed to Secure Payment</> : <><ShoppingBag className="mr-2 h-5 w-5" />Confirm & Pay using COD</>)}
                    </Button>
                </CardFooter>
            </Card>
          </form>
        </Form>

        <div className="lg:col-span-2">
          <Card className="shadow-xl sticky top-24 border-border rounded-lg">
            <CardHeader className="p-5 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">Your Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[calc(100vh-24rem)] overflow-y-auto p-5 sm:p-6">
              {cartItems.map(item => (
                <div key={item.cartItemId} className="flex items-start gap-4 py-3 border-b border-border last:border-b-0">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                     <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="rounded-lg object-cover border bg-muted shadow-sm"
                        sizes="(max-width: 640px) 80px, 96px"
                      />
                      {item.customization?.customImageDataUri && (
                         <Image
                            src={item.customization.customImageDataUri}
                            alt="Customization"
                            fill
                            className="absolute rounded-lg object-contain"
                            style={{
                                transform: `translate(${(item.customization.imageX || 0) -50}%, ${(item.customization.imageY || 0) -50}%) scale(${item.customization.imageScale || 1})`,
                                left: '50%',
                                top: '50%',
                            }}
                             sizes="(max-width: 640px) 72px, 88px"
                        />
                      )}
                      {item.customization?.text && (
                          <div
                            className="absolute pointer-events-none whitespace-pre-wrap break-words text-center overflow-hidden"
                            style={{
                                left: `${item.customization.textX || 10}%`,
                                top: `${item.customization.textY || 10}%`,
                                fontSize: `${(item.customization.textSize || 12) * 0.85}px`,
                                transform: 'translate(-50%, -50%)',
                                color: item.customization.selectedColor || 'hsl(var(--foreground))',
                                width: '100%',
                                height: '100%',
                                lineHeight: '1.1',
                            }}
                          >
                            {item.customization.text}
                          </div>
                      )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-sm sm:text-base leading-tight text-foreground line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                    {item.customization?.selectedColor && <p className="text-xs text-muted-foreground">Color: {item.customization.selectedColor}</p>}
                    {item.customization?.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.customization.selectedSize}</p>}

                    {item.customization?.customImageDataUri && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-primary/80">
                            <ImageIconLucide className="h-3.5 w-3.5"/> Custom Image {item.customization.imageScale && item.customization.imageScale !== 1 ? `(${item.customization.imageScale.toFixed(1)}x)`: ''}
                        </div>
                    )}
                     {item.customization?.text && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-primary/80 truncate" title={item.customization.text}>
                            <Type className="h-3.5 w-3.5"/> Custom Text {item.customization.textSize ? `(${item.customization.textSize}px)`: ''}
                        </div>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-primary ml-auto whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <Separator className="my-3" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">₹{subTotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 dark:text-green-500">
                    <span className="text-muted-foreground">Discount ({appliedCoupon.code})</span>
                    <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-3"/>
                <div className="flex justify-between font-bold text-lg sm:text-xl pt-1">
                  <span className="text-foreground">Grand Total</span>
                  <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
