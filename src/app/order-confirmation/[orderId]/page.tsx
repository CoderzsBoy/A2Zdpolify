
'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Order, OrderItem as OrderItemType } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Loader2, Package, Home, Download, Info, FileText, Image as ImageIconLucide, Type, ShoppingBag } from 'lucide-react'; 
import { format } from 'date-fns'; 
import { Badge } from '@/components/ui/badge';


export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const paymentStatus = searchParams.get('payment'); 

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
        setError("Order ID is missing from the URL.");
        setLoading(false);
        return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderDocRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderDocRef);

        if (orderSnap.exists()) {
          const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
          setOrder(orderData);
        } else {
          setError('Order not found. It might have been an issue placing the order, or the ID is incorrect.');
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError('Failed to load order details. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, paymentStatus]);

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12 md:py-20">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary mb-5" />
        <p className="text-lg sm:text-xl text-muted-foreground">Loading your order confirmation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12 md:py-20 text-center">
        <Alert variant="destructive" className="max-w-lg w-full shadow-lg p-5 sm:p-7 rounded-lg">
          <Package className="h-5 w-5 sm:h-6 sm:w-6" />
          <AlertTitle className="text-lg sm:text-xl font-semibold">Error Loading Order</AlertTitle>
          <AlertDescription className="text-sm sm:text-base mt-1">{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-8 sm:mt-10 text-sm sm:text-base" size="lg">
          <Link href="/"><Home className="mr-2 h-4 w-4" /> Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  if (!order) { 
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12 md:py-20 text-center">
         <Alert variant="default" className="max-w-lg w-full shadow-lg border-orange-500 bg-orange-50 text-orange-800 p-5 sm:p-7 rounded-lg">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-700" />
          <AlertTitle className="text-lg sm:text-xl font-semibold">Order Not Found</AlertTitle>
          <AlertDescription className="text-sm sm:text-base mt-1">The order details could not be retrieved. Please ensure the Order ID is correct or try again.</AlertDescription>
        </Alert>
         <Button asChild variant="outline" className="mt-8 sm:mt-10 text-sm sm:text-base" size="lg">
          <Link href="/"><Home className="mr-2 h-4 w-4" /> Go to Homepage</Link>
        </Button>
      </div>
    );
  }
  
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return format(timestamp.toDate(), 'MMM d, yyyy, h:mm a');
    }
    return 'Invalid Date';
  };

  const digitalItems = order.items.filter(item => item.productType === 'digital' && item.downloadUrl);
  const requiresShippingAddress = order.items.some(item => item.productType === 'physical' || item.productType === 'customized');

  const getOrderStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'Pending Payment': return 'bg-orange-100 text-orange-800 border-orange-400';
      case 'Paid': return 'bg-sky-100 text-sky-800 border-sky-400';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-400';
      case 'Shipped': return 'bg-teal-100 text-teal-800 border-teal-400';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-400';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-400';
      case 'Payment Failed': return 'bg-red-100 text-red-800 border-red-400';
      case 'Return Requested': return 'bg-purple-100 text-purple-800 border-purple-400';
      case 'Returned': return 'bg-indigo-100 text-indigo-800 border-indigo-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };


  return (
    <div className="container py-8 md:py-12">
      <Card className="max-w-3xl lg:max-w-4xl mx-auto shadow-2xl border-border rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 sm:p-8 md:p-10 border-b">
          <CheckCircle className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-green-500 mb-4" />
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            {order.paymentMethod === 'Online Payment' && (order.status === 'Paid' || order.status === 'Completed') ? 'Payment Successful & Order Confirmed!' : 'Order Confirmed!'}
          </CardTitle>
          <CardDescription className="text-base sm:text-lg md:text-xl text-muted-foreground mt-2">
            Thank you for your purchase, {order.customerInfo.name.split(' ')[0]}!
          </CardDescription>
          <p className="text-sm sm:text-base text-muted-foreground mt-3">Order ID: <span className="font-mono bg-muted px-2 py-1 rounded-md text-primary">{order.id}</span></p>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                {requiresShippingAddress ? "Shipping To:" : "Customer Information:"}
            </h3>
            <div className="text-sm sm:text-base text-muted-foreground space-y-1.5 p-4 bg-secondary/40 rounded-lg border border-border">
                <p><strong className="text-foreground">Name:</strong> {order.customerInfo.name}</p>
                {requiresShippingAddress && order.customerInfo.addressLine ? (
                  <>
                    <p><strong className="text-foreground">Address:</strong> {order.customerInfo.addressLine}</p>
                    <p>{order.customerInfo.state}, {order.customerInfo.zipCode}</p>
                  </>
                ) : !requiresShippingAddress ? (
                  <p className="italic">Digital order, no shipping address required.</p>
                ) : (
                  <p className="italic">Shipping address not provided or not applicable.</p>
                )}
                <p><strong className="text-foreground">Email:</strong> {order.customerInfo.email}</p>
                <p><strong className="text-foreground">Phone:</strong> {order.customerInfo.phone}</p>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-foreground">Items Ordered:</h3>
            <div className="space-y-4 sm:space-y-5">
              {order.items.map((item: OrderItemType, index: number) => (
                <div key={`${item.productId}-${index}`} className="flex items-start gap-4 p-3.5 sm:p-4 border rounded-lg bg-card shadow-md">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                    <Image 
                      src={item.image || 'https://placehold.co/96x96/E0E7FF/4F46E5?text=Img'} 
                      alt={item.name} 
                      fill
                      className="rounded-lg object-cover border bg-muted shadow-sm" 
                      data-ai-hint="ordered product image"
                    />
                    {item.customization?.customImageDataUri && (
                        <Image
                            src={item.customization.customImageDataUri}
                            alt="Customization"
                            fill
                            className="absolute rounded-lg object-contain"
                            style={{
                                transform: `translate(${(item.customization.imageX || 0) - 50}%, ${(item.customization.imageY || 0) - 50}%) scale(${item.customization.imageScale || 1})`,
                                left: '50%',
                                top: '50%',
                            }}
                        />
                    )}
                    {item.customization?.text && (
                        <div 
                            className="absolute pointer-events-none whitespace-pre-wrap break-words text-center overflow-hidden"
                            style={{
                                left: `${item.customization.textX || 10}%`,
                                top: `${item.customization.textY || 10}%`,
                                fontSize: `${(item.customization.textSize || 12) * 0.9}px`, 
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
                    <p className="font-semibold text-sm sm:text-base md:text-lg leading-tight text-foreground line-clamp-2">{item.name}</p>
                     <p className="text-xs sm:text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    {item.customization?.selectedColor && <p className="text-xs text-muted-foreground">Color: {item.customization.selectedColor}</p>}
                    {item.customization?.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.customization.selectedSize}</p>}
                    
                    {item.customization?.customImageDataUri && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-primary/80">
                            <ImageIconLucide className="h-3.5 w-3.5"/> Custom Image {item.customization.imageScale && item.customization.imageScale !== 1 ? `(${item.customization.imageScale.toFixed(1)}x)`: ''}
                        </div>
                    )}
                    {item.customization?.text && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-primary/80 truncate" title={item.customization.text}>
                            <Type className="h-3.5 w-3.5"/> Custom Text {item.customization.textSize ? `(${item.customization.textSize}px)`: ''}
                        </div>
                    )}
                  </div>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-primary ml-auto whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {digitalItems.length > 0 && (order.status === 'Paid' || order.status === 'Completed' || order.paymentMethod === 'Cash on Delivery') && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">Your Downloads:</h3>
                <div className="space-y-3 sm:space-y-4">
                  {digitalItems.map((item, index) => (
                    <div key={`download-${item.productId}-${index}`} className="flex items-center justify-between p-3.5 sm:p-4 border rounded-lg bg-green-50 border-green-300 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        <p className="text-sm sm:text-base font-medium text-green-800 line-clamp-1">{item.name}</p>
                      </div>
                      {item.downloadUrl ? (
                        <Button asChild size="default" variant="outline" className="border-green-600 text-green-700 hover:bg-green-100 hover:text-green-800 text-sm h-9 sm:h-10 shadow-sm">
                          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" download>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Download link pending</span>
                      )}
                    </div>
                  ))}
                </div>
                <Alert variant="default" className="mt-4 sm:mt-5 bg-primary/10 border-primary/30 text-primary/90 p-4">
                    <Info className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary font-semibold text-base sm:text-lg">Download Information</AlertTitle>
                    <AlertDescription className="text-sm">
                      Download links for digital products are provided above. For security, links may have an expiration. Please download your files promptly.
                      {order.paymentMethod === 'Cash on Delivery' && " For COD orders, links become active upon payment confirmation if applicable."}
                    </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          <Separator />

          <div className="text-sm sm:text-base space-y-2 p-4 bg-secondary/40 rounded-lg border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold text-foreground">₹{order.subTotal.toFixed(2)}</span>
            </div>
            {order.appliedCoupon && (
              <div className="flex justify-between text-green-600 dark:text-green-500">
                <span className="text-muted-foreground">Discount ({order.appliedCoupon.code}):</span>
                <span className="font-semibold">-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
             <Separator className="my-2 sm:my-2.5"/>
            <div className="flex justify-between text-lg sm:text-xl font-bold pt-1.5">
              <span className="text-foreground">Grand Total:</span>
              <span className="text-primary">₹{order.grandTotal.toFixed(2)}</span>
            </div>
             <Separator className="my-2 sm:my-2.5"/>
             <div className="flex justify-between text-xs sm:text-sm pt-1.5">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium text-foreground">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium text-foreground">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm items-center">
                <span className="text-muted-foreground">Order Status:</span>
                <Badge variant="outline" className={`capitalize px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeVariant(order.status)}`}>{order.status}
                </Badge>
            </div>
          </div>
          
          <Alert variant="default" className="mt-5 sm:mt-8 bg-primary/10 border-primary/30 text-primary/90 p-4">
            <Package className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-semibold text-base sm:text-lg">What's Next?</AlertTitle>
            <AlertDescription className="text-sm">
              {order.paymentMethod === 'Cash on Delivery' ? 
                "Your order is being processed. You will be contacted by our delivery partner for cash payment upon arrival. " :
                (requiresShippingAddress ? 
                  "Your order is being processed. Physical items will be shipped soon. Digital items (if any) are available for download above. " :
                  "Your order is being processed. Digital items are available for download above (if applicable). "
                )
              }
               You can track your order status on the 'My Orders' page or contact us for updates.
            </AlertDescription>
          </Alert>

        </CardContent>
        <CardFooter className="flex justify-center py-5 sm:py-6 border-t rounded-b-lg bg-muted/20">
          <Button asChild variant="default" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-base sm:text-lg px-8 py-3 rounded-lg transform hover:scale-105 transition-transform duration-200">
            <Link href="/"><ShoppingBag className="mr-2.5 h-5 w-5" /> Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
