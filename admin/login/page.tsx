
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2 } from 'lucide-react';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        setError("Admin credentials are not configured in the environment.");
        setLoading(false);
        return;
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      toast({ title: 'Admin Login Successful', description: 'Redirecting to dashboard...' });
      router.push('/admin');
    } else {
      setError('Invalid admin credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center p-6">
          <LogIn className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-2xl font-bold">Admin Panel Login</CardTitle>
          <CardDescription>Enter your admin credentials to proceed.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Log In'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="p-6 text-xs text-muted-foreground text-center">
            This is a restricted area. For authorized personnel only.
        </CardFooter>
      </Card>
    </div>
  );
}
