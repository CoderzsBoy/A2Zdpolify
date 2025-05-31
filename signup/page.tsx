
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState(''); // Added phone state
  const { signUp, error, loading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!displayName.trim()) {
      setFormError("Display Name is required.");
      return;
    }
    if (displayName.trim().length < 3) {
      setFormError("Display Name must be at least 3 characters long.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (phone.trim() && !/^\+?[0-9\s-()]{10,20}$/.test(phone.trim())) {
      setFormError("Invalid phone number format.");
      return;
    }
    const user = await signUp({ email, password, displayName: displayName.trim(), phone: phone.trim() || undefined });
    if (user) {
      router.push('/');
    }
  };

  return (
    <div className="container flex items-center justify-center py-12 md:py-20">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center p-6 md:p-8">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">Create an Account</CardTitle>
          <CardDescription className="text-muted-foreground">Join AtoZdpolify today and start shopping!</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {(error || formError) && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Signup Failed</AlertTitle>
              <AlertDescription>{error || formError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your Name or Nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 12345 67890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="text-sm"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" size="lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm p-6 md:p-8 border-t">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
