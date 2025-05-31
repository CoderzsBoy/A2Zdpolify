
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Minus, Loader2, Image as ImageIcon, Type, Scaling, Move } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const { removeFromCart, updateQuantity, loadingCart } = useCart();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity >= 1) {
      await updateQuantity(item.cartItemId, newQuantity);
    }
  };

  const handleRemove = async () => {
    await removeFromCart(item.cartItemId);
  };

  const displayImage = item.image || 'https://placehold.co/100x100.png';

  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 shadow-sm border-border relative overflow-hidden">
      {loadingCart && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded-lg">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        </div>
      )}
      <Link href={`/product/${item.id}`} className="flex-shrink-0 relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
        <Image
          src={displayImage}
          alt={item.name}
          fill
          className="rounded-md object-cover border border-muted bg-muted"
          data-ai-hint={item.dataAiHint || 'product thumbnail'}
          sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
        />
        {item.customization?.customImageDataUri && (
           <Image
            src={item.customization.customImageDataUri}
            alt="Customization"
            fill
            className="absolute rounded-md object-contain"
            style={{
              transform: `translate(${(item.customization.imageX || 0) - 50}%, ${(item.customization.imageY || 0) - 50}%) scale(${item.customization.imageScale || 1})`,
              left: '50%', 
              top: '50%',
            }}
            sizes="(max-width: 640px) 72px, (max-width: 768px) 88px, 100px" // Slightly smaller than parent
          />
        )}
         {item.customization?.text && (
          <div 
            className="absolute pointer-events-none whitespace-pre-wrap break-words text-center"
            style={{
              left: `${item.customization.textX || 10}%`,
              top: `${item.customization.textY || 10}%`,
              fontSize: `${(item.customization.textSize || 12) * 0.8}px`, // Adjusted for smaller card
              transform: 'translate(-50%, -50%)',
              color: item.customization.selectedColor || 'hsl(var(--foreground))',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'hidden',
              lineHeight: '1.1',
            }}
          >
            {item.customization.text}
          </div>
        )}
      </Link>
      <div className="flex-grow self-start sm:self-center w-full sm:w-auto">
        <Link href={`/product/${item.id}`} className="hover:text-primary transition-colors">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground line-clamp-2">{item.name}</h3>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground">Unit Price: ₹{item.price.toFixed(2)}</p>
        {item.customization?.selectedColor && <p className="text-xs text-muted-foreground">Color: {item.customization.selectedColor}</p>}
        {item.customization?.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.customization.selectedSize}</p>}
        
        {item.customization?.customImageDataUri && (
            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                <ImageIcon className="h-3 w-3"/> Custom Image {item.customization.imageScale && item.customization.imageScale !== 1 ? `(${item.customization.imageScale.toFixed(1)}x)`: ''}
            </div>
        )}
        {item.customization?.text && (
            <div className="mt-1 flex items-center gap-1 text-xs text-indigo-600 truncate" title={item.customization.text}>
                <Type className="h-3 w-3"/> Text: "{item.customization.text.substring(0,15)}{item.customization.text.length > 15 ? '...' : ''}"
                {item.customization.textSize && <span className="text-xs">({item.customization.textSize}px)</span>}
            </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-0">
        <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.quantity - 1)} disabled={item.quantity <= 1 || loadingCart} aria-label="Decrease quantity" className="h-7 w-7 sm:h-8 sm:w-8">
          <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
          min="1"
          className="w-10 h-7 sm:w-12 sm:h-8 text-center text-xs sm:text-sm p-1"
          aria-label="Item quantity"
          disabled={loadingCart}
        />
        <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.quantity + 1)} disabled={loadingCart} aria-label="Increase quantity" className="h-7 w-7 sm:h-8 sm:w-8">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
      <p className="text-sm sm:text-base md:text-lg font-semibold text-primary w-full sm:w-auto text-right mt-2 sm:mt-0 sm:ml-2 md:ml-4">
      ₹{(item.price * item.quantity).toFixed(2)}
      </p>
      <Button variant="ghost" size="icon" onClick={handleRemove} className="text-destructive hover:bg-destructive/10 hover:text-destructive/90 absolute top-1.5 right-1.5 sm:static sm:ml-2 h-7 w-7 sm:h-8 sm:w-8" aria-label="Remove item" disabled={loadingCart}>
        <X className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    </Card>
  );
}
