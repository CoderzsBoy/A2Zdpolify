
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { FeedbackEntry } from '@/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminFeedbackPage() {
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const feedbackQuery = query(collection(db, 'feedback'), orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(feedbackQuery);
        const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackEntry));
        setFeedbackEntries(entries);
      } catch (error) {
        console.error("Error fetching feedback: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
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
      <h1 className="text-2xl font-bold text-foreground">User Feedback</h1>
       <div className="bg-card border rounded-lg shadow-sm">
        <ScrollArea className="h-[calc(100vh-12rem)]"> {/* Adjust height as needed */}
            <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead>Feedback Message</TableHead>
                <TableHead className="w-[180px]">Submitted At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {feedbackEntries.length === 0 && !loading && (
                <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No feedback entries found.</TableCell></TableRow>
                )}
                {feedbackEntries.map((entry) => (
                <TableRow key={entry.id}>
                    <TableCell>
                        {entry.displayName || 'Anonymous'}
                        <br />
                        <span className="text-xs text-muted-foreground">{entry.userEmail}</span>
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap text-sm">{entry.message}</TableCell>
                    <TableCell>{formatDate(entry.submittedAt)}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </ScrollArea>
       </div>
    </div>
  );
}
