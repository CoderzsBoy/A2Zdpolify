
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { ReturnRequest, ReturnRequestStatus } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const adminReturnStatuses: ReturnRequestStatus[] = ['Pending', 'Approved', 'Rejected', 'Processing', 'Completed', 'Cancelled'];

export default function AdminReturnsPage() {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReturnRequests = async () => {
    setLoading(true);
    try {
      const requestsQuery = query(collection(db, 'returns'), orderBy('requestedAt', 'desc'));
      const querySnapshot = await getDocs(requestsQuery);
      const entries = querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<ReturnRequest, 'id'>;
        // Fetch userEmail from associated order if not directly on return request (denormalization example)
        // For now, we assume userEmail might be added to ReturnRequest type during creation or we fetch it.
        // If it's not on ReturnRequest, you'd need another fetch here or ensure it's populated.
        // For simplicity, let's assume userEmail is on ReturnRequest or can be N/A.
        return { 
          id: doc.id, 
          ...data,
          userEmail: data.userEmail || 'N/A' // Ensure userEmail exists
        } as ReturnRequest;
      });
      setReturnRequests(entries);
    } catch (error) {
      console.error("Error fetching return requests: ", error);
      toast({ title: "Error", description: "Failed to fetch return requests.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnRequests();
  }, [toast]);

  const handleStatusChange = async (requestId: string, newStatus: ReturnRequestStatus) => {
    try {
      await updateDoc(doc(db, 'returns', requestId), { status: newStatus });
      toast({ title: "Success", description: `Return request status updated to ${newStatus}.` });
      setReturnRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
    } catch (error) {
      console.error("Error updating return request status: ", error);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const formatDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy, h:mm a');
  };

  const getReturnStatusBadgeVariant = (status: ReturnRequestStatus) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Approved': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'Rejected':
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Manage Return Requests</h1>
      <div className="bg-card border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Order ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>User Email</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>UPI ID</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnRequests.length === 0 && !loading && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No return requests found.</TableCell></TableRow>
            )}
            {returnRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-xs hover:underline">
                    <Link href={`/admin/orders?highlight=${request.orderId}`} title={`View order ${request.orderId}`}>
                        {request.orderId}
                    </Link>
                </TableCell>
                <TableCell className="font-medium">{request.productName}</TableCell>
                <TableCell>{request.userEmail}</TableCell>
                <TableCell className="text-xs max-w-xs truncate" title={request.reason}>{request.reason}</TableCell>
                <TableCell className="text-xs">{request.upiId}</TableCell>
                <TableCell>{formatDate(request.requestedAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize text-xs ${getReturnStatusBadgeVariant(request.status)}`}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Select
                    value={request.status}
                    onValueChange={(newStatus) => handleStatusChange(request.id, newStatus as ReturnRequestStatus)}
                  >
                    <SelectTrigger className="h-9 text-xs w-[180px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminReturnStatuses.map(status => (
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
