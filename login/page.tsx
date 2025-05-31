
"use client";

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [emailOrDisplayName, setEmailOrDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const { logIn, error, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = await logIn({ email: emailOrDisplayName, password }); // Pass as email, AuthContext handles logic
    if (user) {
      router.push(redirectTo);
    }
  };

  return (
    <div className="container flex items-center justify-center py-12 md:py-20">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center p-6 md:p-8">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">Welcome Back!</CardTitle>
          <CardDescription className="text-muted-foreground">Log in to continue to AtoZdpolify.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailOrDisplayName">Email or Display Name</Label>
              <Input
                id="emailOrDisplayName"
                type="text"
                placeholder="you@example.com or YourName"
                value={emailOrDisplayName}
                onChange={(e) => setEmailOrDisplayName(e.target.value)}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" size="lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm p-6 md:p-8 border-t">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
