
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
import { CheckCircle, Loader2, Package, Home, Download, Info, FileText, Image as ImageIconLucide, Type } from 'lucide-react'; 
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
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
        <p className="text-md sm:text-lg text-muted-foreground">Loading your order confirmation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10 text-center">
        <Alert variant="destructive" className="max-w-md w-full shadow-md p-4 sm:p-6">
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          <AlertTitle className="text-md sm:text-lg">Error Loading Order</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6 sm:mt-8 text-sm sm:text-base">
          <Link href="/"><Home className="mr-2 h-4 w-4" /> Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  if (!order) { 
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10 text-center">
         <Alert variant="default" className="max-w-md w-full shadow-md border-orange-400 bg-orange-50 text-orange-700 p-4 sm:p-6">
          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <AlertTitle className="text-md sm:text-lg text-orange-800">Order Not Found</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">The order details could not be retrieved. Please ensure the Order ID is correct or try again.</AlertDescription>
        </Alert>
         <Button asChild variant="outline" className="mt-6 sm:mt-8 text-sm sm:text-base">
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

  return (
    <div className="container py-6 md:py-10">
      <Card className="max-w-2xl lg:max-w-3xl mx-auto shadow-xl border-border">
        <CardHeader className="text-center bg-primary/5 rounded-t-lg p-4 sm:p-6 md:p-8">
          <CheckCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-green-500 mb-3 sm:mb-4" />
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            {order.paymentMethod === 'Online Payment' && (order.status === 'Paid' || order.status === 'Completed') ? 'Payment Successful & Order Confirmed!' : 'Order Confirmed!'}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base md:text-lg text-muted-foreground mt-1">
            Thank you for your purchase, {order.customerInfo.name.split(' ')[0]}!
          </CardDescription>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">Order ID: <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{order.id}</span></p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          <div>
            <h3 className="text-md sm:text-lg font-semibold mb-2 sm:mb-3 text-foreground">
                {requiresShippingAddress ? "Shipping To:" : "Customer Information:"}
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1 p-3 sm:p-4 bg-secondary/30 rounded-md border">
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
            <h3 className="text-md sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Items Ordered:</h3>
            <div className="space-y-3 sm:space-y-4">
              {order.items.map((item: OrderItemType, index: number) => (
                <div key={`${item.productId}-${index}`} className="flex items-start gap-3 sm:gap-4 p-2.5 sm:p-3 border rounded-md bg-card shadow-sm">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                    <Image 
                      src={item.image || 'https://placehold.co/80x80.png'} 
                      alt={item.name} 
                      fill
                      className="rounded-md object-cover border bg-muted" 
                      data-ai-hint="ordered product image"
                    />
                    {item.customization?.customImageDataUri && (
                        <Image
                            src={item.customization.customImageDataUri}
                            alt="Customization"
                            fill
                            className="absolute rounded-md object-contain"
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
                                fontSize: `${(item.customization.textSize || 12) * 0.8}px`, 
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
                    <p className="font-semibold text-xs sm:text-sm md:text-base leading-tight text-foreground line-clamp-2">{item.name}</p>
                     <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                    {item.customization?.selectedColor && <p className="text-xs text-muted-foreground">Color: {item.customization.selectedColor}</p>}
                    {item.customization?.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.customization.selectedSize}</p>}
                    
                    {item.customization?.customImageDataUri && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                            <ImageIconLucide className="h-3 w-3"/> Custom Image {item.customization.imageScale && item.customization.imageScale !== 1 ? `(${item.customization.imageScale.toFixed(1)}x)`: ''}
                        </div>
                    )}
                    {item.customization?.text && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-indigo-600 truncate" title={item.customization.text}>
                            <Type className="h-3 w-3"/> Custom Text {item.customization.textSize ? `(${item.customization.textSize}px)`: ''}
                        </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-primary ml-auto whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {digitalItems.length > 0 && (order.status === 'Paid' || order.status === 'Completed' || order.paymentMethod === 'Cash on Delivery') && (
            <>
              <Separator />
              <div>
                <h3 className="text-md sm:text-lg font-semibold mb-2 sm:mb-3 text-foreground">Your Downloads:</h3>
                <div className="space-y-2 sm:space-y-3">
                  {digitalItems.map((item, index) => (
                    <div key={`download-${item.productId}-${index}`} className="flex items-center justify-between p-2.5 sm:p-3 border rounded-md bg-green-50 border-green-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        <p className="text-xs sm:text-sm font-medium text-green-800 line-clamp-1">{item.name}</p>
                      </div>
                      {item.downloadUrl ? (
                        <Button asChild size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-100 text-xs sm:text-sm h-8 sm:h-9">
                          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" download>
                            <Download className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Download
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Download link pending</span>
                      )}
                    </div>
                  ))}
                </div>
                <Alert variant="default" className="mt-3 sm:mt-4 bg-blue-50 border-blue-200 text-blue-700 p-3 sm:p-4">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-semibold text-sm sm:text-base">Download Information</AlertTitle>
                    <AlertDescription className="text-xs sm:text-sm">
                      Download links for digital products are provided above. For security, links may have an expiration. Please download your files promptly.
                      {order.paymentMethod === 'Cash on Delivery' && " For COD orders, links become active upon payment confirmation if applicable."}
                    </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          <Separator />

          <div className="text-xs sm:text-sm space-y-1.5 p-3 sm:p-4 bg-secondary/30 rounded-md border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold text-foreground">₹{order.subTotal.toFixed(2)}</span>
            </div>
            {order.appliedCoupon && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span className="text-muted-foreground">Discount ({order.appliedCoupon.code}):</span>
                <span className="font-semibold">-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
             <Separator className="my-1.5 sm:my-2"/>
            <div className="flex justify-between text-md sm:text-lg font-bold pt-1">
              <span className="text-foreground">Grand Total:</span>
              <span className="text-primary">₹{order.grandTotal.toFixed(2)}</span>
            </div>
             <Separator className="my-1.5 sm:my-2"/>
             <div className="flex justify-between text-xs pt-1">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium text-foreground">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium text-foreground">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">Order Status:</span>
                <Badge variant="outline" className={`capitalize px-2 py-0.5 text-xs ${
                    order.status === 'Paid' || order.status === 'Delivered' ||  order.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-300' :
                    order.status === 'Pending' || order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    order.status === 'Pending Payment' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                    order.status === 'Cancelled' || order.status === 'Return Requested' || order.status === 'Returned' || order.status === 'Payment Failed' ? 'bg-red-100 text-red-700 border-red-300' :
                    'bg-gray-100 text-gray-700 border-gray-300'
                  }`}>{order.status}
                </Badge>
            </div>
          </div>
          
          <Alert variant="default" className="mt-4 sm:mt-6 bg-blue-50 border-blue-200 text-blue-700 p-3 sm:p-4">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <AlertTitle className="text-blue-800 font-semibold text-sm sm:text-base">What's Next?</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">
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
        <CardFooter className="flex justify-center py-4 sm:py-6 border-t rounded-b-lg bg-muted/30">
          <Button asChild variant="default" size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md text-sm sm:text-base">
            <Link href="/"><Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
