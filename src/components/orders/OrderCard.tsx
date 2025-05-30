
'use client';

import type { Order, OrderItem as OrderItemType, ReturnRequest } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import ReturnItemDialog from './ReturnItemDialog'; 
import { AlertCircle, CheckCircle, Clock, RotateCcw, Truck, Undo2, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OrderCardProps {
  order: Order;
  existingReturnRequests: ReturnRequest[];
}

export default function OrderCard({ order, existingReturnRequests }: OrderCardProps) {
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [itemToReturn, setItemToReturn] = useState<OrderItemType | null>(null);
  const { currentUser } = useAuth();

  const isReturnEligible = (orderDate: Date, itemId: string): boolean => {
    if (order.status === 'Cancelled' || order.status === 'Returned') return false;

    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4); 
    fourDaysAgo.setHours(0,0,0,0); 

    const orderPlacedDate = new Date(orderDate);
    orderPlacedDate.setHours(0,0,0,0); 

    if (existingReturnRequests.some(rr => rr.productId === itemId && rr.orderId === order.id && (rr.status === 'Pending' || rr.status === 'Approved' || rr.status === 'Processing' || rr.status === 'Completed'))) {
      return false;
    }
    return orderPlacedDate >= fourDaysAgo; 
  };
  
  const getOrderStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200/70';
      case 'Pending Payment': return 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200/70';
      case 'Paid': return 'bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200/70';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200/70';
      case 'Shipped': return 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200/70';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200/70';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200/70';
      case 'Return Requested': return 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200/70';
      case 'Returned': return 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200/70';
      default: return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200/70';
    }
  };

  const getOrderStatusIcon = (status: Order['status']) => {
    const className = "h-3.5 w-3.5 mr-1.5";
    switch (status) {
      case 'Pending': return <Clock className={className} />;
      case 'Pending Payment': return <Clock className={`${className} text-orange-700`} />;
      case 'Paid': return <CheckCircle className={`${className} text-sky-700`} />;
      case 'Processing': return <RotateCcw className={`${className} text-blue-700`} />;
      case 'Shipped': return <Truck className={`${className} text-teal-700`} />;
      case 'Delivered': return <CheckCircle className={`${className} text-green-700`} />;
      case 'Cancelled': return <Ban className={`${className} text-red-700`} />;
      case 'Return Requested': return <Undo2 className={`${className} text-purple-700`} />;
      case 'Returned': return <CheckCircle className={`${className} text-indigo-700`} />;
      default: return <Clock className={className} />;
    }
  };


  const handleReturnClick = (item: OrderItemType) => {
    setItemToReturn(item);
    setIsReturnDialogOpen(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return format(timestamp.toDate(), 'MMM d, yyyy, h:mm a'); 
    }
    return 'Invalid Date';
  };

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-border bg-card">
        <CardHeader className="bg-muted/50 p-4 md:p-5 rounded-t-lg border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg md:text-xl text-foreground">Order ID: <span className="font-mono text-primary">{order.id}</span></CardTitle>
              <CardDescription className="text-xs md:text-sm">Placed on: {formatDate(order.createdAt)}</CardDescription>
            </div>
            <Badge variant="outline" className={`capitalize px-3 py-1.5 text-xs md:text-sm flex items-center font-semibold ${getOrderStatusBadgeVariant(order.status)}`}>
              {getOrderStatusIcon(order.status)} {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-5 space-y-4">
          <div>
            <h4 className="font-semibold mb-3 text-foreground text-base">Items:</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const orderPlacedDate = order.createdAt.toDate();
                const canReturn = isReturnEligible(orderPlacedDate, item.productId);
                const existingReturn = existingReturnRequests.find(rr => rr.productId === item.productId && rr.orderId === order.id);
                const isDigitalNoCOD = item.productType === 'digital' && order.paymentMethod !== 'Cash on Delivery';


                return (
                  <div key={`${item.productId}-${index}`} className="flex flex-col sm:flex-row items-start gap-3 p-3 border rounded-md bg-background shadow-sm">
                    <Image
                      src={item.image || 'https://placehold.co/80x80.png'}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover h-20 w-20 border flex-shrink-0 bg-muted"
                      data-ai-hint="ordered product image"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-sm md:text-base leading-tight text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} | Price: ₹{item.price.toFixed(2)}</p>
                      {item.customization?.selectedColor && <p className="text-xs text-muted-foreground">Color: {item.customization.selectedColor}</p>}
                      {item.customization?.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.customization.selectedSize}</p>}
                      {item.customization?.text && <p className="text-xs text-muted-foreground truncate" title={item.customization.text}>Text: "{item.customization.text}"</p>}
                    </div>
                    <div className="sm:ml-auto flex flex-col items-end gap-2 mt-2 sm:mt-0 self-start sm:self-center">
                       <p className="text-sm md:text-base font-semibold text-primary whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</p>
                       {item.productType !== 'digital' && ( // Return only for non-digital items
                         existingReturn ? (
                          <Badge variant="outline" className={`capitalize text-xs px-2 py-1 ${existingReturn.status === 'Pending' ? 'bg-orange-100 text-orange-700 border-orange-300' : existingReturn.status === 'Approved' ? 'bg-sky-100 text-sky-700 border-sky-300' : existingReturn.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                              Return {existingReturn.status}
                          </Badge>
                         ) : canReturn ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturnClick(item)}
                            className="text-xs h-8 px-3 hover:bg-accent hover:text-accent-foreground"
                          >
                            <Undo2 className="mr-1.5 h-3.5 w-3.5"/>Return Product
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled className="text-xs h-8 px-3">
                            Return Window Closed
                          </Button>
                        )
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />
          
          { (order.customerInfo.addressLine || order.customerInfo.state) && ( // Only show if address details exist
            <div>
              <h4 className="font-semibold mb-2 text-foreground text-base">Shipping To:</h4>
              <address className="text-xs md:text-sm text-muted-foreground space-y-0.5 not-italic p-3 bg-secondary/30 rounded-md border">
                  <p><strong className="text-foreground">Name:</strong> {order.customerInfo.name}</p>
                  <p><strong className="text-foreground">Address:</strong> {order.customerInfo.addressLine}, {order.customerInfo.state}, {order.customerInfo.zipCode}</p>
                  <p><strong className="text-foreground">Email:</strong> {order.customerInfo.email}</p>
                  <p><strong className="text-foreground">Phone:</strong> {order.customerInfo.phone}</p>
              </address>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 md:p-5 bg-muted/50 rounded-b-lg border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs md:text-sm text-muted-foreground">
            Payment Method: <span className="font-semibold text-foreground">{order.paymentMethod}</span>
          </div>
          <div className="text-right w-full sm:w-auto">
            {order.appliedCoupon && (
              <p className="text-xs text-green-600 dark:text-green-400">Discount ({order.appliedCoupon.code}): -₹{order.discountAmount.toFixed(2)}</p>
            )}
            <p className="text-sm text-muted-foreground">Subtotal: ₹{order.subTotal.toFixed(2)}</p>
            <p className="text-lg md:text-xl font-bold text-primary">Grand Total: ₹{order.grandTotal.toFixed(2)}</p>
          </div>
        </CardFooter>
      </Card>

      {itemToReturn && currentUser && (
        <ReturnItemDialog
          isOpen={isReturnDialogOpen}
          onClose={() => setIsReturnDialogOpen(false)}
          order={order}
          item={itemToReturn}
          userId={currentUser.uid}
        />
      )}
    </>
  );
}
