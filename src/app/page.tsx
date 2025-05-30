
"use client"; // Required for fetching data client-side and using hooks

import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import ProductList from '@/components/products/ProductList';
import RecommendationsSection from '@/components/products/RecommendationsSection';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Truck, WalletCards } from 'lucide-react'; // Added icons
import { Separator } from '@/components/ui/separator'; // Added Separator

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
        const q = query(productsCol, orderBy("name"), firestoreLimit(20)); 
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

  return (
    <div className="container">
      {/* USP Banner Section */}
      <section className="my-6 md:my-8 bg-gradient-to-r from-primary/80 via-primary/90 to-accent/80 text-primary-foreground p-4 sm:p-5 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-around items-center gap-3 sm:gap-6 text-center">
          <div className="flex items-center gap-2 group cursor-default">
            <Truck className="h-6 w-6 sm:h-7 sm:w-7 transform transition-transform duration-300 group-hover:scale-110" />
            <span className="font-semibold text-sm sm:text-base">Free Shipping on All Orders!</span>
          </div>
          <Separator orientation="vertical" className="hidden sm:block h-8 bg-primary-foreground/30" />
          <div className="block sm:hidden w-2/3 h-px bg-primary-foreground/20 my-1"></div> {/* Mobile separator */}
          <div className="flex items-center gap-2 group cursor-default">
            <WalletCards className="h-6 w-6 sm:h-7 sm:w-7 transform transition-transform duration-300 group-hover:scale-110" />
            <span className="font-semibold text-sm sm:text-base">Cash on Delivery Available!</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-10 md:py-16 text-center bg-muted rounded-lg shadow-md mb-10 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-foreground">Welcome to AtoZdpolify</h1>
        <p className="text-md sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-xl md:max-w-2xl mx-auto px-2">
          Discover your next favorite thing. Explore our curated collection of unique products.
        </p>
        <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="#all-products">Shop Now</Link>
        </Button>
      </section>
      
      <div id="all-products" className="mb-10 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 md:mb-8 text-center md:text-left text-foreground">All Products</h2>
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg bg-card shadow-sm">
                <Skeleton className="h-[200px] sm:h-[220px] w-full rounded-md" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-center text-destructive py-10">{error}</p>}
        {!loading && !error && <ProductList products={products} />}
      </div>
      
      <RecommendationsSection />
    </div>
  );
}
