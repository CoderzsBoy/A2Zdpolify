
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import type { Order, OrderItem, OrderStatus } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const adminOrderStatuses: OrderStatus[] = [
  'Pending',
  'Approved',
  'Processing',
  'Shipped',
  'Delivered',
  'Completed',
  'Cancelled',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(ordersQuery);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders: ", error);
      toast({ title: "Error", description: "Failed to fetch orders.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [toast]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast({ title: "Success", description: `Order status updated to ${newStatus}.` });
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error updating order status: ", error);
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    }
  };

  const getOrderStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Pending Payment': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Paid': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'Approved': return 'bg-lime-100 text-lime-700 border-lime-300'; // New color for Approved
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Shipped': return 'bg-teal-100 text-teal-700 border-teal-300';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-300';
      case 'Return Requested': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Returned': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
  
  const formatDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy, h:mm a');
  };


  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Manage Orders</h1>
      <div className="bg-card border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[250px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No orders found.</TableCell></TableRow>
            )}
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id}</TableCell>
                <TableCell>{order.customerInfo.name} <br/><span className="text-xs text-muted-foreground">{order.customerInfo.email}</span></TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>₹{order.grandTotal.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize text-xs ${getOrderStatusBadgeVariant(order.status)}`}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center space-x-2 flex items-center justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    {selectedOrder && selectedOrder.id === order.id && (
                       <DialogContent className="sm:max-w-2xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] p-1">
                          <div className="p-4 space-y-4">
                            <p><strong>Customer:</strong> {selectedOrder.customerInfo.name} ({selectedOrder.customerInfo.email})</p>
                            <p><strong>Phone:</strong> {selectedOrder.customerInfo.phone}</p>
                            {selectedOrder.customerInfo.addressLine && <p><strong>Address:</strong> {selectedOrder.customerInfo.addressLine}, {selectedOrder.customerInfo.state} {selectedOrder.customerInfo.zipCode}</p>}
                            <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                            <p><strong>Total:</strong> ₹{selectedOrder.grandTotal.toFixed(2)} (Subtotal: ₹{selectedOrder.subTotal.toFixed(2)}, Discount: ₹{selectedOrder.discountAmount.toFixed(2)})</p>
                             {selectedOrder.appliedCoupon && <p><strong>Coupon:</strong> {selectedOrder.appliedCoupon.code} ({selectedOrder.appliedCoupon.discount}%)</p>}
                            <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                            <p><strong>Status:</strong> <Badge variant="outline" className={`capitalize text-xs ${getOrderStatusBadgeVariant(selectedOrder.status)}`}>{selectedOrder.status}</Badge></p>
                            <Separator className="my-3"/>
                            <h4 className="font-semibold">Items:</h4>
                            {selectedOrder.items.map((item, index) => (
                              <div key={index} className="flex gap-3 border-b pb-2 mb-2 items-start">
                                <Image src={item.image} alt={item.name} width={60} height={60} className="rounded border object-cover"/>
                                <div>
                                  <p className="font-medium text-sm">{item.name} (x{item.quantity})</p>
                                  <p className="text-xs text-muted-foreground">Price: ₹{item.price.toFixed(2)}</p>
                                  {item.customization && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {item.customization.selectedColor && <p>Color: {item.customization.selectedColor}</p>}
                                      {item.customization.selectedSize && <p>Size: {item.customization.selectedSize}</p>}
                                      {item.customization.text && <p className="truncate" title={item.customization.text}>Text: "{item.customization.text}"</p>}
                                      {item.customization.customImageDataUri && <p>Custom Image Applied</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                       </DialogContent>
                    )}
                  </Dialog>
                  <Select
                    value={order.status}
                    onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}
                  >
                    <SelectTrigger className="h-9 text-xs w-[160px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminOrderStatuses.map(status => (
                        <SelectItem key={status} value={status} className="text-xs">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
