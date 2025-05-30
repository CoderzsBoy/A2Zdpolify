
"use client";

import type { Product, CartItem, CartItemCustomization, CartItemFirestore, Coupon, ProductImage } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, customization?: CartItemCustomization, imageUrlForCart?: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  subTotal: number;
  grandTotal: number;
  discountAmount: number;
  appliedCoupon: Coupon | null; // This will hold the validated coupon object
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: () => void;
  loadingCart: boolean;
  loadingCoupon: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getPrimaryImageUrl = (images: ProductImage[] | undefined): string => {
  if (!images || images.length === 0) return 'https://placehold.co/300x200.png'; // Default placeholder
  const primary = images.find(img => img.isPrimary);
  return primary ? primary.url : images[0].url;
};


export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [userAppliedCoupon, setUserAppliedCoupon] = useState<Coupon | null>(null); // Store the raw coupon from DB
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchProductDetails = useCallback(async (productId: string): Promise<Product | null> => {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    }
    console.warn(`Product with ID ${productId} not found.`);
    return null;
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoadingCart(true);
      const cartColRef = collection(db, `users/${currentUser.uid}/cart`);
      const unsubscribe = onSnapshot(cartColRef, async (snapshot) => {
        const itemsPromises = snapshot.docs.map(async (cartDoc) => {
          const cartItemData = cartDoc.data() as CartItemFirestore;
          const productDetails = await fetchProductDetails(cartItemData.productId);
          if (productDetails) {
            const cartItem: CartItem = {
              ...productDetails,
              cartItemId: cartDoc.id,
              quantity: cartItemData.quantity,
              customization: cartItemData.customization || undefined,
              image: cartItemData.imageForCart || getPrimaryImageUrl(productDetails.images),
            };
            return cartItem;
          }
          return null;
        });

        const resolvedItems = (await Promise.all(itemsPromises)).filter(item => item !== null) as CartItem[];
        setCartItems(resolvedItems);
        setLoadingCart(false);
      }, (error) => {
        console.error("Error fetching cart items:", error);
        toast({ title: "Error", description: "Could not load cart items.", variant: "destructive" });
        setLoadingCart(false);
      });
      return () => unsubscribe();
    } else {
      setCartItems([]);
      setUserAppliedCoupon(null);
      setLoadingCart(false);
    }
  }, [currentUser, toast, fetchProductDetails]);

  const subTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const {
    amount: discountAmount,
    isValid: isCouponValid,
    couponToDisplay, // This is the coupon that is currently valid and applied
  } = useMemo(() => {
    if (!userAppliedCoupon) return { amount: 0, isValid: false, couponToDisplay: null };

    let isValid = true;
    let discount = 0;

    // Check expiry
    if (userAppliedCoupon.validTill) {
      const endOfDayExpiry = new Date(userAppliedCoupon.validTill instanceof Timestamp ? userAppliedCoupon.validTill.toDate() : userAppliedCoupon.validTill);
      endOfDayExpiry.setHours(23, 59, 59, 999); // Consider valid for the whole day
      if (new Date() > endOfDayExpiry) {
        isValid = false;
      }
    }

    // Check min amount
    if (subTotal < userAppliedCoupon.minAmount) {
      isValid = false;
    }
    
    // Check maxUses vs timesUsed
    if (typeof userAppliedCoupon.maxUses === 'number' && (userAppliedCoupon.timesUsed || 0) >= userAppliedCoupon.maxUses) {
      isValid = false;
    }


    if (isValid) {
      discount = (subTotal * userAppliedCoupon.discount) / 100;
    }

    return {
      amount: discount,
      isValid: isValid,
      couponToDisplay: isValid ? userAppliedCoupon : null, // Only display if still valid
    };
  }, [subTotal, userAppliedCoupon]);


  useEffect(() => {
    // Effect to automatically remove coupon if cart changes make it invalid
    if (userAppliedCoupon && !isCouponValid) {
       // If there was a discount, it means the coupon was previously valid
      if ((subTotal * userAppliedCoupon.discount) / 100 > 0) {
        toast({ title: "Coupon Invalidated", description: `Coupon ${userAppliedCoupon.code} no longer applies to your cart.`, variant: "destructive", duration: 4000 });
      }
      // We don't set userAppliedCoupon to null here directly because the userAppliedCoupon state is what's checked.
      // The couponToDisplay will become null based on the useMemo logic.
    }
  }, [isCouponValid, userAppliedCoupon, subTotal, toast]);


  const grandTotal = useMemo(() => {
    return Math.max(0, subTotal - discountAmount);
  }, [subTotal, discountAmount]);


  const applyCoupon = useCallback(async (couponCode: string) => {
    if (!couponCode.trim()) {
      toast({ title: "Invalid Coupon", description: "Please enter a coupon code.", variant: "destructive" });
      return;
    }
    setLoadingCoupon(true);
    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where("code", "==", couponCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "Invalid Coupon", description: "This coupon code does not exist.", variant: "destructive" });
        setUserAppliedCoupon(null); setLoadingCoupon(false); return;
      }
      const couponDoc = querySnapshot.docs[0];
      const couponData = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      if (!couponData.isActive) {
        toast({ title: "Coupon Inactive", description: "This coupon is no longer active.", variant: "destructive" });
        setUserAppliedCoupon(couponData); setLoadingCoupon(false); return; // Set it so user sees why it's invalid
      }

      if (couponData.validTill) {
        const endOfDayExpiry = new Date(couponData.validTill instanceof Timestamp ? couponData.validTill.toDate() : couponData.validTill);
        endOfDayExpiry.setHours(23, 59, 59, 999);
        if (new Date() > endOfDayExpiry) {
          toast({ title: "Coupon Expired", description: "This coupon has expired.", variant: "destructive" });
          setUserAppliedCoupon(couponData); setLoadingCoupon(false); return;
        }
      }

      if (subTotal < couponData.minAmount) {
        toast({ title: "Minimum Spend Not Met", description: `You need to spend at least ₹${couponData.minAmount.toFixed(2)} to use this coupon. Current subtotal is ₹${subTotal.toFixed(2)}.`, variant: "destructive", duration: 4000 });
        setUserAppliedCoupon(couponData); setLoadingCoupon(false); return;
      }
      
      const currentTimesUsed = couponData.timesUsed || 0;
      if (typeof couponData.maxUses === 'number' && currentTimesUsed >= couponData.maxUses) {
          toast({ title: "Coupon Limit Reached", description: "This coupon has reached its maximum usage limit.", variant: "destructive" });
          setUserAppliedCoupon(couponData); // Set to show why it might be invalid
          setLoadingCoupon(false); 
          return;
      }

      setUserAppliedCoupon(couponData); // Coupon seems valid at this point
      const potentialDiscount = (subTotal * couponData.discount) / 100;
      toast({ title: "Coupon Applied", description: `${couponData.code} applied! Saving ₹${potentialDiscount.toFixed(2)}.` });

    } catch (err) {
      console.error("Error applying coupon:", err);
      toast({ title: "Error", description: "Could not apply coupon.", variant: "destructive" });
      setUserAppliedCoupon(null);
    } finally {
      setLoadingCoupon(false);
    }
  }, [subTotal, toast]);

  const removeCoupon = useCallback(() => {
    if (userAppliedCoupon) {
      toast({ title: "Coupon Removed", description: `Coupon ${userAppliedCoupon.code} has been removed.` });
    }
    setUserAppliedCoupon(null);
  }, [toast, userAppliedCoupon]);

  const addToCart = async (product: Product, quantity: number = 1, customization?: CartItemCustomization, imageUrlForCart?: string) => {
    if (!currentUser) {
      toast({ title: "Please Log In", description: "You need to be logged in to add items to your cart.", variant: "destructive" });
      return;
    }
    setLoadingCart(true);
    try {
      const cartColRef = collection(db, `users/${currentUser.uid}/cart`);
      const finalCustomization: CartItemCustomization = {};
      let hasValidCustomization = false;

      if (customization && Object.keys(customization).length > 0) {
        for (const key in customization) {
          if (Object.prototype.hasOwnProperty.call(customization, key)) {
            const K = key as keyof CartItemCustomization;
            const value = customization[K];
            if (value !== undefined && value !== null) {
              if (typeof value === 'string' && value.trim() === '') { /* Skip empty strings */ }
              else if (typeof value === 'number' && isNaN(value)) { /* Skip NaN */ }
              else {
                (finalCustomization as any)[K] = value;
                hasValidCustomization = true;
              }
            }
          }
        }
      }
      const effectiveCustomization = hasValidCustomization ? finalCustomization : null;
      const effectiveImageUrlForCart = imageUrlForCart || getPrimaryImageUrl(product.images);

      let existingCartItemDocId: string | null = null;
      const q = query(cartColRef, where("productId", "==", product.id));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        const docCustomizationStr = docData.customization ? JSON.stringify(docData.customization) : null;
        const effectiveCustomizationStr = effectiveCustomization ? JSON.stringify(effectiveCustomization) : null;
        const docImageForCart = docData.imageForCart;

        if (docCustomizationStr === effectiveCustomizationStr && docImageForCart === effectiveImageUrlForCart) {
          existingCartItemDocId = doc.id;
        }
      });

      if (existingCartItemDocId) {
        const existingItemRef = doc(db, `users/${currentUser.uid}/cart`, existingCartItemDocId);
        const existingItemSnap = await getDoc(existingItemRef);
        if (existingItemSnap.exists()) {
          const existingQuantity = existingItemSnap.data().quantity || 0;
          await updateDoc(existingItemRef, { quantity: existingQuantity + quantity });
        }
      } else {
         const cartItemPayload: CartItemFirestore = {
            productId: product.id,
            quantity,
            addedAt: serverTimestamp() as Timestamp,
            imageForCart: effectiveImageUrlForCart,
         };
         if (effectiveCustomization) {
           cartItemPayload.customization = effectiveCustomization;
         }
         await addDoc(cartColRef, cartItemPayload);
      }
      toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.` });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({ title: "Error Adding to Cart", description: `Could not add item. ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    } finally {
      setLoadingCart(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!currentUser) return;
    setLoadingCart(true);
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/cart`, cartItemId));
      toast({ title: "Removed from Cart", description: `Item removed.`, variant: "destructive" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast({ title: "Error", description: "Could not remove item.", variant: "destructive" });
    } finally {
      setLoadingCart(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!currentUser) return;
    if (quantity <= 0) {
      await removeFromCart(cartItemId); return;
    }
    setLoadingCart(true);
    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/cart`, cartItemId), { quantity });
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({ title: "Error", description: "Could not update quantity.", variant: "destructive" });
    } finally {
      setLoadingCart(false);
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;
    setLoadingCart(true);
    try {
      const cartColRef = collection(db, `users/${currentUser.uid}/cart`);
      const snapshot = await getDocs(cartColRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setUserAppliedCoupon(null);
      toast({ title: "Cart Cleared", description: "All items removed." });
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({ title: "Error", description: "Could not clear cart.", variant: "destructive" });
    } finally {
      setLoadingCart(false);
    }
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      subTotal,
      grandTotal,
      discountAmount,
      appliedCoupon: couponToDisplay, // Expose the validated and currently active coupon
      applyCoupon,
      removeCoupon,
      loadingCart,
      loadingCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
