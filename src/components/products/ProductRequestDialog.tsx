
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProductRequestFormData } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Lightbulb } from 'lucide-react';

const productRequestFormSchema = z.object({
  productName: z.string().min(3, { message: "Product name must be at least 3 characters." }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(1000),
  category: z.string().max(50).optional(),
  estimatedPrice: z.string().max(20).optional(), // Kept as string for flexibility e.g., "Around 500 INR"
  referenceLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  userEmail: z.string().email({ message: "Invalid email address." }),
});

interface ProductRequestDialogProps {
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export default function ProductRequestDialog({ triggerButton }: ProductRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProductRequestFormData>({
    resolver: zodResolver(productRequestFormSchema),
    defaultValues: {
      productName: '',
      description: '',
      category: '',
      estimatedPrice: '',
      referenceLink: '',
      userEmail: '',
    },
  });

  useEffect(() => {
    if (currentUser?.email) {
      form.setValue('userEmail', currentUser.email);
    } else {
      form.setValue('userEmail', ''); // Clear if user logs out while dialog might be prepped
    }
  }, [currentUser, form, isOpen]); // Re-run if currentUser changes or dialog opens

  const onSubmit = async (data: ProductRequestFormData) => {
    setIsSubmitting(true);
    try {
      const requestData = {
        ...data,
        userId: currentUser?.uid || null,
        requestedAt: serverTimestamp(),
        status: 'Pending Review' as const,
      };

      await addDoc(collection(db, 'productRequests'), requestData);
      
      toast({
        title: "Request Submitted!",
        description: "Thank you for your product suggestion. We'll review it shortly.",
        duration: 5000,
      });
      form.reset();
      setIsOpen(false); // Close dialog on success
    } catch (error) {
      console.error("Error submitting product request:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your product request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : 
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> Request a Product
          </Button>
        }
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Request a New Product
          </DialogTitle>
          <DialogDescription className="text-sm">
            Can't find what you're looking for? Let us know and we might add it to our store!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Product Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Eco-friendly Yoga Mat" {...field} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Product Description <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the product, its features, why you want it..." {...field} rows={4} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Your Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} disabled={!!currentUser?.email} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Category (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sports, Home Goods" {...field} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimatedPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Estimated Price (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Around ₹1000, $15-$20" {...field} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Reference Link (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/similar-product" {...field} className="text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-3 pt-3">
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
