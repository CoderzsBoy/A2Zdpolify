
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Order, ReturnRequest, UserDocument } from '@/types';
import { Loader2, ShoppingBag, PackageSearch, AlertTriangle, Inbox, Gift } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OrderCard from '@/components/orders/OrderCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SurpriseGiftDialog from '@/components/rewards/SurpriseGiftDialog';

export default function OrdersPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null);
  const [keptProductCount, setKeptProductCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGiftDialogEligible, setIsGiftDialogEligible] = useState(false);
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      setUserProfile(userSnap.data() as UserDocument);
    } else {
      console.warn("User profile not found in Firestore for gift eligibility check.");
      setUserProfile(null);
    }
  }, []);
  
  const calculateKeptProducts = useCallback((allOrders: Order[], allReturns: ReturnRequest[]) => {
    let count = 0;
    for (const order of allOrders) {
      if (order.status !== 'Cancelled' && order.status !== 'Returned' && order.status !== 'Payment Failed') {
        for (const item of order.items) {
          const relevantReturn = allReturns.find(
            rr => rr.orderId === order.id && 
                  rr.productId === item.productId &&
                  (rr.status === 'Approved' || rr.status === 'Completed' || rr.status === 'Processing')
          );
          if (!relevantReturn) {
            count += item.quantity;
          }
        }
      }
    }
    return count;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      if (!authLoading) { 
        setLoadingData(false);
      }
      return;
    }

    const fetchData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        await fetchUserProfile(currentUser.uid);

        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const orderSnapshot = await getDocs(ordersQuery);
        const fetchedOrders = orderSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        setOrders(fetchedOrders);

        let fetchedReturns: ReturnRequest[] = [];
        if (fetchedOrders.length > 0) {
          const orderIds = fetchedOrders.map(o => o.id);
          const returnsQueryBatches = [];
          for (let i = 0; i < orderIds.length; i += 30) { 
            const batchOrderIds = orderIds.slice(i, i + 30);
            returnsQueryBatches.push(
              query(
                collection(db, 'returns'),
                where('userId', '==', currentUser.uid),
                where('orderId', 'in', batchOrderIds)
              )
            );
          }
          const returnSnapshots = await Promise.all(returnsQueryBatches.map(q => getDocs(q)));
          fetchedReturns = returnSnapshots.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data()} as ReturnRequest)));
          setReturnRequests(fetchedReturns);
        }
        
        const currentKeptCount = calculateKeptProducts(fetchedOrders, fetchedReturns);
        setKeptProductCount(currentKeptCount);

      } catch (err) {
        console.error('Error fetching orders/returns/profile:', err);
        setError('Failed to load your data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [currentUser, authLoading, fetchUserProfile, calculateKeptProducts]);


  useEffect(() => {
    if (userProfile && !userProfile.hasClaimedFiveProductGift && keptProductCount >= 5) {
      setIsGiftDialogEligible(true);
      setIsGiftDialogOpen(true); 
    } else {
      setIsGiftDialogEligible(false);
      setIsGiftDialogOpen(false);
    }
  }, [userProfile, keptProductCount]);

  const handleGiftClaimed = () => {
    if (currentUser) {
      fetchUserProfile(currentUser.uid);
    }
    setIsGiftDialogOpen(false);
    setIsGiftDialogEligible(false);
  };


  if (authLoading || loadingData) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
        <p className="text-md sm:text-lg text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10 text-center">
        <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-5" />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3">Access Your Orders</h1>
        <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md text-sm sm:text-base">Please <Link href="/login" className="text-primary hover:underline font-medium">log in</Link> to view your order history and manage returns.</p>
        <Button asChild size="lg" className="text-sm sm:text-base">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Alert variant="destructive" className="max-w-lg mx-auto shadow-md p-4 sm:p-6">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          <AlertTitle className="text-md sm:text-lg">Error Loading Data</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-10 text-center text-foreground">My Orders</h1>
      
      {isGiftDialogEligible && !userProfile?.hasClaimedFiveProductGift && (
         <div className="mb-6 sm:mb-8 p-4 border border-dashed border-accent bg-accent/10 rounded-lg text-center shadow-sm">
            <Gift className="mx-auto h-7 w-7 sm:h-8 sm:w-8 text-accent mb-2"/>
            <h3 className="text-lg sm:text-xl font-semibold text-accent">You've Unlocked a Reward!</h3>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 mb-3">Congratulations on purchasing {keptProductCount} items! Claim your surprise gift.</p>
            <Button onClick={() => setIsGiftDialogOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs sm:text-sm">
                Claim Your Gift
            </Button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-25rem)] py-10 text-center">
          <Inbox className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-5" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3">No Orders Yet</h1>
          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md text-sm sm:text-base">You haven't placed any orders. Start shopping to see your order history here!</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base">
            <Link href="/">Go Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6 md:space-y-8">
          {orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              existingReturnRequests={returnRequests.filter(rr => rr.orderId === order.id)} 
            />
          ))}
        </div>
      )}

      {currentUser && (
        <SurpriseGiftDialog
          isOpen={isGiftDialogOpen}
          onOpenChange={setIsGiftDialogOpen}
          onGiftClaimed={handleGiftClaimed}
        />
      )}
    </div>
  );
}
