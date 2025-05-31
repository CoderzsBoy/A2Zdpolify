
'use client';

import { useState, useEffect } from 'react'; // Added useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Order, OrderItem, ReturnRequestData } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Undo2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface ReturnItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  item: OrderItem;
  userId: string;
}

const returnFormSchema = z.object({
  upiId: z.string().min(5, { message: "UPI ID must be at least 5 characters." }).regex(/^[a-zA-Z0-9.\-_@]{2,}@[a-zA-Z]{2,}$/, "Invalid UPI ID format (e.g., user@bank)."),
  reason: z.string().min(10, { message: "Please provide a reason with at least 10 characters." }).max(500, { message: "Reason cannot exceed 500 characters." }),
});

export default function ReturnItemDialog({ isOpen, onClose, order, item, userId }: ReturnItemDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth(); // Get currentUser

  const form = useForm<ReturnRequestData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      upiId: '',
      reason: '',
    },
  });

  useEffect(() => {
    // Reset form when dialog is closed or item changes to prevent stale data
    if (!isOpen) {
      form.reset({ upiId: '', reason: '' });
    }
  }, [isOpen, item, form]);


  const onSubmit = async (data: ReturnRequestData) => {
    setIsSubmitting(true);
    if (!currentUser) {
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }
    try {
      const returnRequestDoc = {
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        quantityReturned: item.quantity, 
        userId: userId,
        userEmail: currentUser.email || 'N/A', // Add userEmail
        upiId: data.upiId,
        reason: data.reason,
        requestedAt: serverTimestamp() as Timestamp,
        status: 'Pending' as const,
        orderCreatedAt: order.createdAt, 
      };

      await addDoc(collection(db, 'returns'), returnRequestDoc);
      
      toast({
        title: "Return Request Submitted",
        description: `Your request to return ${item.name} has been submitted successfully.`,
        duration: 5000,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error submitting return request:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your return request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-primary" />
            Request Return: {item.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Please provide your UPI ID for refund processing and specify the reason for returning this item.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 my-4 p-3 border rounded-md bg-muted/50 shadow-sm">
            <Image
                src={item.image || 'https://placehold.co/60x60.png'}
                alt={item.name}
                width={60}
                height={60}
                className="rounded-md object-cover h-16 w-16 border bg-background"
                data-ai-hint="product to return"
            />
            <div>
                <p className="font-semibold text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity} | Price: ₹{item.price.toFixed(2)}</p>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="upiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">UPI ID for Refund</FormLabel>
                  <FormControl>
                    <Input placeholder="yourname@okhdfcbank" {...field} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Reason for Return</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Please describe why you are returning this item..." {...field} rows={4} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
