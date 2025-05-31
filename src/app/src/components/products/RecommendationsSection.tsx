
"use client";

import { useEffect, useState, useCallback } from 'react';
import { getProductRecommendations, type ProductRecommendationOutput } from '@/ai/flows/product-recommendation';
import type { Product, BrowsingHistoryEntry } from '@/types';
import ProductCard from './ProductCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles } from 'lucide-react'; // Added Sparkles icon
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchProductDetails = useCallback(async (productId: string): Promise<Product | null> => {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    }
    return null;
  }, []);
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentUser) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const historyColRef = collection(db, `users/${currentUser.uid}/browsingHistory`);
        const historyQuery = query(historyColRef, orderBy("viewedAt", "desc"), limit(10));
        const historySnapshot = await getDocs(historyQuery);
        const browsingHistoryProductNames = historySnapshot.docs.map(doc => (doc.data() as BrowsingHistoryEntry).productName);

        if (browsingHistoryProductNames.length === 0) {
          setIsLoading(false);
          return; 
        }

        const genkitOutput: ProductRecommendationOutput = await getProductRecommendations({ 
          browsingHistory: browsingHistoryProductNames.join(', ') 
        });

        if (genkitOutput && genkitOutput.recommendations && genkitOutput.recommendations.length > 0) {
          const recommendedProductDetails: Product[] = [];
          const productsCol = collection(db, 'products');
          const allProductsSnapshot = await getDocs(query(productsCol, limit(50))); 
          
          const allFetchedProducts = allProductsSnapshot.docs.map(d => ({id: d.id, ...d.data() } as Product));

          for (const recName of genkitOutput.recommendations.slice(0,4)) { 
            const foundProduct = allFetchedProducts.find(p => p.name.toLowerCase() === recName.toLowerCase());
            if (foundProduct) {
                // Avoid recommending products already in the browsing history that triggered the recommendation
                if (!browsingHistoryProductNames.includes(foundProduct.name)) {
                   recommendedProductDetails.push(foundProduct);
                }
            }
          }
          setRecommendations(recommendedProductDetails.slice(0,4)); // Ensure only 4 are shown
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Could not fetch recommendations at this time.");
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser, fetchProductDetails]);

  if (!currentUser && !isLoading) {
    return (
        <section className="my-12 md:my-16 p-6 md:p-8 bg-muted/70 rounded-lg shadow-md border border-border">
          <div className="text-center">
            <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">Personalized For You</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link> and browse some products to see personalized recommendations here!
            </p>
            <Button asChild>
                <Link href="/login">Log In to See Recommendations</Link>
            </Button>
          </div>
        </section>
    );
  }
  
  if (isLoading) {
    return (
      <section className="my-12 md:my-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-foreground">You Might Also Like...</h2>
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Loading recommendations...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-12 md:my-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-foreground">You Might Also Like...</h2>
        <Alert variant="destructive" className="max-w-2xl mx-auto">
         <AlertTitle className="text-lg">Recommendation Error</AlertTitle>
         <AlertDescription>{error}</AlertDescription>
       </Alert>
      </section>
    );
  }

  if (recommendations.length === 0 && currentUser) {
     return (
        <section className="my-12 md:my-16 p-6 md:p-8 bg-muted/70 rounded-lg shadow-md border border-border">
            <div className="text-center">
                <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">Discover More!</h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Browse more products to help us tailor recommendations just for you.
                </p>
                <Button asChild variant="outline">
                    <Link href="/">Explore Products</Link>
                </Button>
            </div>
        </section>
    );
  }
  
  if (recommendations.length === 0) {
    return null; 
  }

  return (
    <section className="my-12 md:my-16">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-foreground">You Might Also Like...</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8"> {/* Adjusted grid for wider cards */}
        {recommendations.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

