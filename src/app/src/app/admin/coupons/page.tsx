
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
import type { Coupon } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, Edit2, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const couponFormSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters.").toUpperCase(),
  discount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, "Discount must be positive.").max(100, "Discount cannot exceed 100%.")
  ),
  isActive: z.boolean().default(true),
  minAmount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, "Minimum amount must be positive.")
  ),
  validTill: z.date({ required_error: "Expiry date is required." }),
  maxUses: z.preprocess( // Optional field
    (val) => (String(val).trim() === '' ? undefined : parseInt(String(val), 10)),
    z.number().min(0, "Max uses must be positive.").optional()
  ),
  timesUsed: z.preprocess( // Optional field
    (val) => (String(val).trim() === '' ? undefined : parseInt(String(val), 10)),
    z.number().min(0, "Times used must be positive.").optional().default(0)
  ),
});

type CouponFormData = z.infer<typeof couponFormSchema>;

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      discount: 10,
      isActive: true,
      minAmount: 0,
      validTill: new Date(),
      maxUses: undefined,
      timesUsed: 0,
    },
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const couponsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          validTill: (data.validTill as Timestamp)?.toDate ? (data.validTill as Timestamp).toDate() : new Date(data.validTill), // Convert Firestore Timestamp
        } as Coupon;
      });
      setCoupons(couponsData as any); // Temp any due to Timestamp conversion issue
    } catch (error) {
      console.error("Error fetching coupons: ", error);
      toast({ title: "Error", description: "Failed to fetch coupons.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [toast]);

  const handleDialogOpen = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      form.reset({
        ...coupon,
        validTill: coupon.validTill instanceof Timestamp ? coupon.validTill.toDate() : new Date(coupon.validTill),
        maxUses: coupon.maxUses ?? undefined, // Handle null/undefined from Firestore
        timesUsed: coupon.timesUsed ?? 0,
      });
    } else {
      setEditingCoupon(null);
      form.reset({
        code: '', discount: 10, isActive: true, minAmount: 0,
        validTill: new Date(new Date().setDate(new Date().getDate() + 30)), // Default to 30 days from now
        maxUses: undefined, timesUsed: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CouponFormData) => {
    try {
      const couponData = {
        ...data,
        code: data.code.toUpperCase(), // Ensure code is uppercase
        validTill: Timestamp.fromDate(data.validTill), // Convert Date to Firestore Timestamp
        maxUses: data.maxUses === undefined ? null : data.maxUses, // Store null if undefined
        timesUsed: data.timesUsed === undefined ? 0 : data.timesUsed,
      };

      if (editingCoupon) {
        await setDoc(doc(db, 'coupons', editingCoupon.id), couponData, { merge: true });
        toast({ title: "Success", description: "Coupon updated successfully." });
      } else {
        // Check if coupon code already exists for new coupons
        const existingCouponQuery = query(collection(db, 'coupons'), where('code', '==', couponData.code));
        const existingSnapshot = await getDocs(existingCouponQuery);
        if (!existingSnapshot.empty) {
            toast({ title: "Error", description: "Coupon code already exists.", variant: "destructive" });
            return;
        }
        const newDocRef = doc(collection(db, 'coupons'));
        await setDoc(newDocRef, couponData);
        toast({ title: "Success", description: "Coupon added successfully." });
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error("Error saving coupon: ", error);
      toast({ title: "Error", description: "Failed to save coupon.", variant: "destructive" });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteDoc(doc(db, 'coupons', couponId));
        toast({ title: "Success", description: "Coupon deleted successfully." });
        fetchCoupons();
      } catch (error) {
        console.error("Error deleting coupon: ", error);
        toast({ title: "Error", description: "Failed to delete coupon.", variant: "destructive" });
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Manage Coupons</h1>
        <Button onClick={() => handleDialogOpen()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Coupon
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Update the details of this coupon.' : 'Fill in the details to add a new coupon.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
            <div><Label htmlFor="code">Code</Label><Input id="code" {...form.register('code')} className="uppercase" />{form.formState.errors.code && <p className="text-xs text-destructive mt-1">{form.formState.errors.code.message}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="discount">Discount (%)</Label><Input id="discount" type="number" step="0.01" {...form.register('discount')} />{form.formState.errors.discount && <p className="text-xs text-destructive mt-1">{form.formState.errors.discount.message}</p>}</div>
                <div><Label htmlFor="minAmount">Min. Amount (₹)</Label><Input id="minAmount" type="number" step="0.01" {...form.register('minAmount')} />{form.formState.errors.minAmount && <p className="text-xs text-destructive mt-1">{form.formState.errors.minAmount.message}</p>}</div>
            </div>
            <div>
              <Label htmlFor="validTill">Valid Till</Label>
              <Controller
                name="validTill"
                control={form.control}
                render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                )}
              />
              {form.formState.errors.validTill && <p className="text-xs text-destructive mt-1">{form.formState.errors.validTill.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="maxUses">Max Uses (Optional)</Label><Input id="maxUses" type="number" {...form.register('maxUses')} />{form.formState.errors.maxUses && <p className="text-xs text-destructive mt-1">{form.formState.errors.maxUses.message}</p>}</div>
                <div><Label htmlFor="timesUsed">Times Used</Label><Input id="timesUsed" type="number" {...form.register('timesUsed')} />{form.formState.errors.timesUsed && <p className="text-xs text-destructive mt-1">{form.formState.errors.timesUsed.message}</p>}</div>
            </div>

            <div className="flex items-center space-x-2">
                <Controller name="isActive" control={form.control} render={({ field }) => (<Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />)} />
                <Label htmlFor="isActive" className="text-sm font-normal">Is Active?</Label>
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingCoupon ? 'Save Changes' : 'Add Coupon')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Min. Amount</TableHead>
              <TableHead>Valid Till</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Max Uses</TableHead>
              <TableHead className="text-center">Used</TableHead>
              <TableHead className="w-[150px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 && !loading && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No coupons found.</TableCell></TableRow>
            )}
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-medium">{coupon.code}</TableCell>
                <TableCell className="text-right">{coupon.discount}%</TableCell>
                <TableCell className="text-right">₹{coupon.minAmount.toFixed(2)}</TableCell>
                <TableCell>{format(coupon.validTill instanceof Timestamp ? coupon.validTill.toDate() : new Date(coupon.validTill), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-center">{coupon.maxUses ?? 'N/A'}</TableCell>
                <TableCell className="text-center">{coupon.timesUsed ?? 0}</TableCell>
                <TableCell className="text-center space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleDialogOpen(coupon)} className="h-8 w-8 hover:text-primary hover:border-primary">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDeleteCoupon(coupon.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:border-destructive/80 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
