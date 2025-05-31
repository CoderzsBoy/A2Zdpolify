
"use client";

import type { Product, WishlistItem, WishlistItemFirestore } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>; // Use productId to identify item to remove
  isWishlisted: (productId: string) => boolean;
  wishlistCount: number;
  loadingWishlist: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchProductDetails = useCallback(async (productId: string): Promise<Product | null> => {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    }
    console.warn(`Product with ID ${productId} not found for wishlist.`);
    return null;
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoadingWishlist(true);
      const wishlistColRef = collection(db, `users/${currentUser.uid}/wishlist`);
      const unsubscribe = onSnapshot(wishlistColRef, async (snapshot) => {
        const items: WishlistItem[] = [];
        for (const wishlistDoc of snapshot.docs) {
          const wishlistItemData = wishlistDoc.data() as WishlistItemFirestore;
          const productDetails = await fetchProductDetails(wishlistItemData.productId);
          if (productDetails) {
            items.push({
              ...productDetails,
              wishlistItemId: wishlistDoc.id, // Use Firestore doc ID
            });
          }
        }
        setWishlistItems(items);
        setLoadingWishlist(false);
      }, (error) => {
        console.error("Error fetching wishlist items:", error);
        toast({ title: "Error", description: "Could not load wishlist.", variant: "destructive" });
        setLoadingWishlist(false);
      });
      return () => unsubscribe();
    } else {
      setWishlistItems([]);
      setLoadingWishlist(false);
    }
  }, [currentUser, toast, fetchProductDetails]);

  const addToWishlist = async (product: Product) => {
    if (!currentUser) {
      toast({ title: "Please Log In", description: "You need to be logged in to add items to your wishlist.", variant: "destructive" });
      return;
    }
    if (isWishlisted(product.id)) return; // Already in wishlist

    setLoadingWishlist(true);
    try {
      const wishlistColRef = collection(db, `users/${currentUser.uid}/wishlist`);
      // Check if already exists by productId to prevent duplicates
      const q = query(wishlistColRef, where("productId", "==", product.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
         toast({ title: "Already in Wishlist", description: `${product.name} is already in your wishlist.`});
         setLoadingWishlist(false);
         return;
      }

      await addDoc(wishlistColRef, {
        productId: product.id,
        addedAt: serverTimestamp(),
      } as WishlistItemFirestore);
      toast({ title: "Added to Wishlist", description: `${product.name} has been added to your wishlist.` });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast({ title: "Error", description: "Could not add item to wishlist.", variant: "destructive" });
    } finally {
      setLoadingWishlist(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!currentUser) return;
    setLoadingWishlist(true);
    try {
      const wishlistColRef = collection(db, `users/${currentUser.uid}/wishlist`);
      const q = query(wishlistColRef, where("productId", "==", productId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.warn(`Product ${productId} not found in wishlist for user ${currentUser.uid}`);
        setLoadingWishlist(false);
        return;
      }

      // Assuming only one item per productId in wishlist
      const docToDelete = snapshot.docs[0];
      await deleteDoc(doc(db, `users/${currentUser.uid}/wishlist`, docToDelete.id));
      toast({ title: "Removed from Wishlist", description: `Item has been removed from your wishlist.`, variant: "destructive" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({ title: "Error", description: "Could not remove item from wishlist.", variant: "destructive" });
    } finally {
      setLoadingWishlist(false);
    }
  };

  const isWishlisted = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };
  
  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isWishlisted, wishlistCount, loadingWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
