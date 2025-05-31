
"use client"; 

import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import ProductList from '@/components/products/ProductList';
import RecommendationsSection from '@/components/products/RecommendationsSection';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Truck, WalletCards, Sparkles } from 'lucide-react'; 
import { Separator } from '@/components/ui/separator'; 

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, orderBy("name"), firestoreLimit(12)); 
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productList);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const uspText = "भारत का पहला ईकॉमर्स साइट जो कैश ऑन डिलीवरी देता है";
  const repeatedUspText = `${uspText}  •  ${uspText}  •  ${uspText}  •  ${uspText}`;

  return (
    <>
      {/* Animated Text Banner */}
      <section className="marquee-banner w-full shadow-md">
        <p className="marquee-text">
          {repeatedUspText}
        </p>
      </section>

      <div className="container">
        {/* USP Banner Section */}
        <section className="my-6 md:my-10 bg-gradient-to-r from-primary/90 via-purple-600 to-accent/90 text-primary-foreground p-5 sm:p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-around items-center gap-4 sm:gap-8 text-center">
            <div className="flex items-center gap-2.5 group cursor-default">
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-300 group-hover:scale-110" />
              <span className="font-semibold text-sm sm:text-base md:text-lg">Free Shipping on All Orders!</span>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-10 bg-primary-foreground/40" />
            <div className="block sm:hidden w-2/3 h-px bg-primary-foreground/30 my-2"></div> 
            <div className="flex items-center gap-2.5 group cursor-default">
              <WalletCards className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-300 group-hover:scale-110" />
              <span className="font-semibold text-sm sm:text-base md:text-lg">Cash on Delivery Available!</span>
            </div>
          </div>
        </section>

        {/* Hero Section - More impactful */}
        <section className="py-16 md:py-24 text-center bg-card/50 border border-border rounded-xl shadow-md mb-12 md:mb-16 relative overflow-hidden">
          {/* Subtle background pattern or gradient for hero */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-50 z-0"></div>
          <div className="relative z-10">
              <Sparkles className="mx-auto h-12 w-12 text-accent mb-4" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight text-balance">
              Discover Your <span className="text-primary">Next Favorite</span> Thing
              </h1>
              <p className="text-md sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-lg md:max-w-2xl mx-auto px-2 text-balance">
              Explore our curated collection of unique products, designed to inspire and delight. Quality and style, delivered to your door.
              </p>
              <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <Link href="#all-products">Shop Collection</Link>
              </Button>
          </div>
        </section>
        
        <div id="all-products" className="mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-8 md:mb-10 text-center text-foreground">Featured Products</h2>
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
                  <Skeleton className="h-[220px] sm:h-[250px] w-full rounded-md bg-muted" />
                  <Skeleton className="h-7 w-4/5 bg-muted" />
                  <Skeleton className="h-6 w-1/2 bg-muted" />
                  <Skeleton className="h-10 w-full mt-3 bg-muted" />
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-center text-destructive py-12 text-lg">{error}</p>}
          {!loading && !error && <ProductList products={products} />}
        </div>
        
        <RecommendationsSection />
      </div>
    </>
  );
}
