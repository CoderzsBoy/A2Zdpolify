
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { ProductRequest, ProductRequestStatus } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; // Added this import

const requestStatuses: ProductRequestStatus[] = ['Pending Review', 'Under Consideration', 'Approved', 'Not Feasible', 'Sourced'];

export default function AdminProductRequestsPage() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const requestsQuery = query(collection(db, 'productRequests'), orderBy('requestedAt', 'desc'));
      const querySnapshot = await getDocs(requestsQuery);
      const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductRequest));
      setRequests(entries);
    } catch (error) {
      console.error("Error fetching product requests: ", error);
      toast({ title: "Error", description: "Failed to fetch product requests.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [toast]);

  const handleStatusChange = async (requestId: string, newStatus: ProductRequestStatus) => {
    try {
      await updateDoc(doc(db, 'productRequests', requestId), { status: newStatus });
      toast({ title: "Success", description: "Request status updated." });
      fetchRequests(); // Re-fetch to reflect changes
    } catch (error) {
      console.error("Error updating request status: ", error);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
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
      <h1 className="text-2xl font-bold text-foreground">Product Requests</h1>
       <div className="bg-card border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>User Email</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No product requests found.</TableCell></TableRow>
            )}
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.productName}</TableCell>
                <TableCell>{request.userEmail}</TableCell>
                <TableCell>{formatDate(request.requestedAt)}</TableCell>
                <TableCell className="text-xs max-w-xs truncate" title={request.description}>{request.description}</TableCell>
                <TableCell>
                  <Badge variant={request.status === 'Approved' || request.status === 'Sourced' ? 'default' : 'secondary'}
                         className={request.status === 'Approved' || request.status === 'Sourced' ? 'bg-green-100 text-green-700' : 
                                    request.status === 'Not Feasible' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Select
                    value={request.status}
                    onValueChange={(newStatus) => handleStatusChange(request.id, newStatus as ProductRequestStatus)}
                  >
                    <SelectTrigger className="h-9 text-xs w-[180px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {requestStatuses.map(status => (
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

