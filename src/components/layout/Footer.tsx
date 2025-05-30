
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { Github, Linkedin, Twitter } from 'lucide-react'; 
import ProductRequestDialog from '@/components/products/ProductRequestDialog';
import FeedbackDialog from '@/components/feedback/FeedbackDialog'; // Import FeedbackDialog

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-10 md:py-12 text-center">
        <div className="mb-4">
          <Link href="/" className="font-bold text-lg text-primary hover:opacity-80 transition-opacity">
            AtoZdpolify
          </Link>
        </div>
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mb-6 text-sm text-muted-foreground">
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
        <div className="flex justify-center space-x-4 mb-6">
          <Link href="#" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-colors">
            <Github className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
            <Linkedin className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
            <Twitter className="h-5 w-5" />
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear !== null ? currentYear : ''} AtoZdpolify. All rights reserved.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Built with Next.js, Tailwind CSS, and ShadCN UI.
        </p>
      </div>
    </footer>
  );
}
