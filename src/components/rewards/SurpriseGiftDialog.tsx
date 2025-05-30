
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
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // May not be needed for address, but good for consistency
import type { GiftClaimFormData, GiftClaim } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, Send } from 'lucide-react';

const giftClaimFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).regex(/^\+?[0-9\s-()]{10,20}$/, "Invalid phone number format."),
  addressLine: z.string().min(5, { message: "Address (Road Name/Area/Colony) is required and must be at least 5 characters." }),
  state: z.string().min(2, { message: "State/Province is required." }),
  zipCode: z.string().regex(/^\d{5,10}(?:[-\s]\d{4})?$/, "Invalid zip code format."),
});

interface SurpriseGiftDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGiftClaimed: () => void; // Callback to inform parent that gift was claimed
}

export default function SurpriseGiftDialog({ isOpen, onOpenChange, onGiftClaimed }: SurpriseGiftDialogProps) {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<GiftClaimFormData>({
    resolver: zodResolver(giftClaimFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      addressLine: '',
      state: '',
      zipCode: '',
    },
  });
  
  useEffect(() => {
    // Pre-fill name from currentUser if available and form is shown
    if (showClaimForm && currentUser?.displayName) {
      form.setValue('name', currentUser.displayName);
    }
     if (!isOpen) { // Reset when dialog closes
        setShowClaimForm(false);
        form.reset();
    }
  }, [currentUser, showClaimForm, form, isOpen]);

  const handleClaimGift = () => {
    setShowClaimForm(true);
  };

  const onSubmit = async (data: GiftClaimFormData) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to claim a gift.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const giftClaimData: Omit<GiftClaim, 'id'> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'N/A',
        claimedAt: serverTimestamp() as Timestamp,
        shippingDetails: data,
        giftType: "5ProductMilestone",
      };

      await addDoc(collection(db, 'giftClaims'), giftClaimData);

      // Mark gift as claimed for the user
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        hasClaimedFiveProductGift: true,
      });
      
      toast({
        title: "Gift Claimed!",
        description: "Congratulations! Your surprise gift will be processed. We'll use these details for shipping.",
        duration: 7000,
      });
      onGiftClaimed(); // Notify parent
      onOpenChange(false); // Close dialog
      form.reset();
      setShowClaimForm(false);
    } catch (error) {
      console.error("Error submitting gift claim:", error);
      toast({
        title: "Claim Failed",
        description: "Could not submit your gift claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        {!showClaimForm ? (
          <>
            <DialogHeader className="mb-4 text-center">
              <Gift className="mx-auto h-12 w-12 text-primary mb-3" />
              <DialogTitle className="text-xl">Congratulations!</DialogTitle>
              <DialogDescription className="text-base">
                You've purchased 5 products and earned a surprise gift!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Maybe Later
              </Button>
              <Button onClick={handleClaimGift} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                Claim Surprise Gift!
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl flex items-center gap-2">
                 <Gift className="h-5 w-5 text-primary" /> Claim Your Gift
              </DialogTitle>
              <DialogDescription className="text-sm">
                Please provide your shipping details for the surprise gift.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} className="text-sm"/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Phone Number</FormLabel>
                      <FormControl><Input type="tel" placeholder="+91 12345 67890" {...field} className="text-sm"/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressLine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Address (Road Name/Area/Colony)</FormLabel>
                      <FormControl><Input placeholder="123 Main St, Green Valley" {...field} className="text-sm"/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">State/Province</FormLabel>
                        <FormControl><Input placeholder="California" {...field} className="text-sm"/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Zip/Postal Code</FormLabel>
                        <FormControl><Input placeholder="90210" {...field} className="text-sm"/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="gap-2 pt-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setShowClaimForm(false)} className="w-full sm:w-auto">
                      Back
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit & Claim
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
