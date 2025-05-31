
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { UserDocument } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(usersQuery);
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserDocument));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users: ", error);
        // Consider adding a toast notification here for the admin
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const formatDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy, h:mm a');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
      <div className="bg-card border rounded-lg shadow-sm">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-center">Gift Claimed?</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && !loading && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No users found.</TableCell></TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || 'N/A'}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-center">
                    {user.hasClaimedFiveProductGift ? (
                      <Badge variant="default" className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5">
                        <CheckCircle className="mr-1 h-3 w-3" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                         <XCircle className="mr-1 h-3 w-3" /> No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{user.uid}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
