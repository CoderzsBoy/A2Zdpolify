
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Skip auth check for login page itself
    if (pathname === '/admin/login') {
      setIsAuthenticated(true); // Allow login page to render
      return;
    }

    const isAdmin = sessionStorage.getItem('isAdminAuthenticated') === 'true';
    if (!isAdmin) {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router, pathname]);

  if (isAuthenticated === null && pathname !== '/admin/login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Do not render sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
     // This case should ideally be handled by the redirect, but as a fallback:
    return null; // Or a loading/access denied message if redirect fails
  }


  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
