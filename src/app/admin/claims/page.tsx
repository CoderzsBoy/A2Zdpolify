
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { GiftClaim } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminGiftClaimsPage() {
  const [claims, setClaims] = useState<GiftClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const claimsQuery = query(collection(db, 'giftClaims'), orderBy('claimedAt', 'desc'));
        const querySnapshot = await getDocs(claimsQuery);
        const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GiftClaim));
        setClaims(entries);
      } catch (error) {
        console.error("Error fetching gift claims: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);
  
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
      <h1 className="text-2xl font-bold text-foreground">Gift Claims</h1>
      <div className="bg-card border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Email</TableHead>
              <TableHead>Gift Type</TableHead>
              <TableHead>Claimed At</TableHead>
              <TableHead>Shipping Name</TableHead>
              <TableHead>Shipping Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No gift claims found.</TableCell></TableRow>
            )}
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell>{claim.userEmail}</TableCell>
                <TableCell>{claim.giftType}</TableCell>
                <TableCell>{formatDate(claim.claimedAt)}</TableCell>
                <TableCell>{claim.shippingDetails.name}</TableCell>
                <TableCell className="text-xs">
                    {claim.shippingDetails.addressLine}<br/>
                    {claim.shippingDetails.state}, {claim.shippingDetails.zipCode}<br/>
                    Ph: {claim.shippingDetails.phone}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
