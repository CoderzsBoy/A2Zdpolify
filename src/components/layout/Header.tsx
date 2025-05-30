
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Search, Menu, LogOut, User as UserIcon, Package, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ProductSearch from '@/components/products/ProductSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOGO_URL = "https://res.cloudinary.com/dlgpwihpq/image/upload/c_fill,w_400,h_300,ar_4:3/v1748580754/download_gfzuhg.png";
const LOGO_ALT = "AtoZdpolify Logo";

export default function Header() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { currentUser, logOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    setMobileMenuOpen(false);
  };

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  const navItems = [
    { href: '/', label: 'Home', icon: <Store />, mobileOnly: false },
    { href: '/cart', label: 'Cart', icon: <ShoppingCart />, count: cartCount, mobileOnly: false },
    { href: '/wishlist', label: 'Wishlist', icon: <Heart />, count: wishlistCount, mobileOnly: false },
    { href: '/orders', label: 'My Orders', icon: <Package />, mobileOnly: true, requiresAuth: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-3 md:mr-6 flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
          <Image
            src={LOGO_URL}
            alt={LOGO_ALT}
            width={159} 
            height={40}
            className="h-10 object-contain" 
            priority
          />
        </Link>

        <div className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium flex-grow ml-4 md:ml-6">
          {/* Desktop navigation links can go here if more are needed */}
        </div>

        <div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2 md:space-x-3">
          <div className="hidden sm:block w-full max-w-xs lg:max-w-sm">
             <ProductSearch />
          </div>

          <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex relative rounded-full">
            <Link href="/cart" aria-label="Shopping Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full">{cartCount}</Badge>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex relative rounded-full">
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full">{wishlistCount}</Badge>
              )}
            </Link>
          </Button>

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9 border border-primary/30">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(currentUser.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center cursor-pointer">
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>My Orders</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={loading} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="hidden md:inline-flex" variant="outline" size="sm">
              <Link href="/login">Log In</Link>
            </Button>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs p-0 pt-4 bg-background">
              <SheetHeader className="p-4 border-b">
                 <SheetTitle className="text-left">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                        <Image
                          src={LOGO_URL}
                          alt={LOGO_ALT}
                          width={159}
                          height={40}
                          className="h-10 object-contain"
                        />
                    </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-2">
                <ProductSearch onSearch={() => setMobileMenuOpen(false)} />
                {navItems.map((item) => {
                  if (item.requiresAuth && !currentUser) return null;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between py-3 text-base font-medium text-foreground hover:text-primary rounded-md hover:bg-primary/10 px-3 -mx-3 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && React.cloneElement(item.icon as React.ReactElement, { className: "h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"})}
                        {item.label}
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                         <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">{item.count}</Badge>
                      )}
                    </Link>
                  );
                })}
                <hr className="my-4"/>
                {currentUser ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 -mx-3 mb-2">
                        <Avatar className="h-10 w-10 border border-primary/30">
                            <AvatarImage src={currentUser.photoURL || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(currentUser.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium leading-tight text-foreground">
                                {currentUser.displayName || currentUser.email?.split('@')[0]}
                            </p>
                            <p className="text-xs leading-tight text-muted-foreground">
                                {currentUser.email}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="w-full border-destructive text-destructive hover:bg-destructive/10" disabled={loading}>
                      <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3 pt-2">
                    <Button asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
