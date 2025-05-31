
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  MessageSquare,
  Gift,
  FileText,
  LogOut,
  Settings,
  Lightbulb,
  Undo2
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: FileText },
  { href: '/admin/returns', label: 'Return Requests', icon: Undo2 },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/admin/requests', label: 'Product Requests', icon: Lightbulb },
  { href: '/admin/claims', label: 'Gift Claims', icon: Gift },
  { href: '/admin/users', label: 'Users', icon: Users },
  // { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const LOGO_URL = "https://res.cloudinary.com/dlgpwihpq/image/upload/c_fill,w_400,h_300,ar_4:3/v1748580754/download_gfzuhg.png";
const LOGO_ALT = "AtoZdpolify Admin Logo";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col sticky top-0 h-screen">
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center justify-center">
           <Image
            src={LOGO_URL}
            alt={LOGO_ALT}
            width={64} 
            height={48} 
            className="h-12 object-contain" 
          />
        </Link>
      </div>
      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={cn(
              'w-full justify-start text-sm font-normal',
              pathname === item.href ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:border-destructive/50" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
