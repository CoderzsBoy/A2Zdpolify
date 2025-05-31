
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { Github, Linkedin, Twitter, ShoppingBag } from 'lucide-react'; 
import ProductRequestDialog from '@/components/products/ProductRequestDialog';
import FeedbackDialog from '@/components/feedback/FeedbackDialog'; 

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t bg-card/50 mt-12 md:mt-16">
      <div className="container py-10 md:py-16 text-center">
        <div className="mb-6">
          <Link href="/" className="inline-block">
            {/* Assuming you might want your image logo here too, or keep text */}
            {/* <Image src={LOGO_URL} alt="AtoZdpolify Logo" width={159} height={40} className="h-10 object-contain" /> */}
            <ShoppingBag className="h-10 w-10 text-primary mx-auto mb-2" />
            <span className="font-bold text-xl text-primary hover:opacity-80 transition-opacity">
              AtoZdpolify
            </span>
          </Link>
        </div>
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 mb-8 text-sm text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">About Us</Link>
          <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
          <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          <ProductRequestDialog 
            triggerButton={
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Request a Product
              </button>
            }
          />
          <FeedbackDialog 
            triggerButton={
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Provide Feedback
              </button>
            }
          />
        </nav>
        <div className="flex justify-center space-x-5 mb-8">
          <Link href="#" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
            <Github className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
            <Linkedin className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
            <Twitter className="h-5 w-5" />
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear !== null ? currentYear : ''} AtoZdpolify. All rights reserved.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/80">
          Crafted with Next.js, Tailwind CSS, and ShadCN UI.
        </p>
      </div>
    </footer>
  );
}
