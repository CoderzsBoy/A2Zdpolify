
"use client";

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { FeedbackFormData, FeedbackEntry } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MessageSquareText } from 'lucide-react';

const feedbackFormSchema = z.object({
  message: z.string().min(10, { message: "Feedback message must be at least 10 characters." }).max(2000, { message: "Feedback message cannot exceed 2000 characters." }),
});

interface FeedbackDialogProps {
  triggerButton?: React.ReactNode;
}

export default function FeedbackDialog({ triggerButton }: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You must be logged in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData: Omit<FeedbackEntry, 'id'> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'N/A',
        displayName: currentUser.displayName || null,
        message: data.message,
        submittedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your valuable feedback. We appreciate you taking the time!",
        duration: 5000,
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your feedback. Please try again.",
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
          <Button variant="link" className="text-sm text-muted-foreground hover:text-primary transition-colors px-0">
            <MessageSquareText className="mr-2 h-4 w-4 inline-block" /> Provide Feedback
          </Button>
        }
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-primary" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription className="text-sm">
            We value your opinion! Please let us know what you think or if you have any suggestions.
          </DialogDescription>
        </DialogHeader>

        {!currentUser ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Please log in to submit feedback.</p>
            <Button onClick={() => setIsOpen(false)} asChild>
                <a href="/login">Log In</a>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Your Feedback <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your experience, suggestions, or any issues..." {...field} rows={6} className="text-sm"/>
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
                  Submit Feedback
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
