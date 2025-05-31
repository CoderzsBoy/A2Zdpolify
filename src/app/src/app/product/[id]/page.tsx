
"use client";

import React, { useEffect, useState, useCallback, use, useRef } from 'react';
import Image from 'next/image';
import type { Product, CartItemCustomization, DigitalProductSpecifics, CustomizedProductSpecifics, PhysicalProductSpecifics, ProductImage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShoppingCart, Heart, Info, Download, ImagePlus, Type, Loader2, ArrowLeft, Share2, ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import RecommendationsSection from '@/components/products/RecommendationsSection';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';

interface ProductPageParams {
  id: string;
}

// Helper functions defined OUTSIDE and BEFORE the component
const isCustomizable = (p: Product): p is Product & CustomizedProductSpecifics & Partial<PhysicalProductSpecifics> =>
  p.productType === 'customized';

const isPhysicalOrCustomizableWithPhysical = (p: Product): p is Product & PhysicalProductSpecifics & Partial<CustomizedProductSpecifics> =>
  p.productType === 'physical' || (p.productType === 'customized' && ((p as any).availableColors || (p as any).availableSizes));

const isDigital = (p: Product): p is Product & DigitalProductSpecifics =>
  p.productType === 'digital';

const getPrimaryImage = (images: ProductImage[]): ProductImage | null => {
  if (!images || images.length === 0) return null;
  return images.find(img => img.isPrimary) || images[0];
};


export default function ProductPage({ params: paramsPromise }: { params: Promise<ProductPageParams> }) {
  const params = use(paramsPromise);
  const { id } = params;

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted, loadingWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [currentImage, setCurrentImage] = useState<ProductImage | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [customImageDataUri, setCustomImageDataUri] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');

  const [imageX, setImageX] = useState(50);
  const [imageY, setImageY] = useState(50);
  const [imageScale, setImageScale] = useState(1);

  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(10);
  const [textSize, setTextSize] = useState(24);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    type: 'image' | 'text';
    initialMouseX: number;
    initialMouseY: number;
    initialElementX: number;
    initialElementY: number;
  } | null>(null);


  const addProductToFirestoreHistory = useCallback(async (productName: string, productId: string) => {
    if (!currentUser || !productName || !productId) return;
    try {
      const historyColRef = collection(db, `users/${currentUser.uid}/browsingHistory`);
      await addDoc(historyColRef, {
        productId,
        productName,
        viewedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error adding product to Firestore history:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoadingProduct(true);
      setError(null);
      if (!id) {
        setError("Product ID is missing.");
        setLoadingProduct(false);
        return;
      }
      try {
        const productDocRef = doc(db, 'products', id);
        const productSnap = await getDoc(productDocRef);
        if (productSnap.exists()) {
          const fetchedProduct = { id: productSnap.id, ...productSnap.data() } as Product;
          setProduct(fetchedProduct);
          setCurrentImage(getPrimaryImage(fetchedProduct.images));
          addProductToFirestoreHistory(fetchedProduct.name, fetchedProduct.id);

          if (isCustomizable(fetchedProduct)) {
            setImageX(fetchedProduct.defaultImageX || 50);
            setImageY(fetchedProduct.defaultImageY || 50);
            setImageScale(fetchedProduct.defaultImageScale || 1);
            setTextX(fetchedProduct.defaultTextX || 50);
            setTextY(fetchedProduct.defaultTextY || 10);
            setTextSize(fetchedProduct.defaultTextSize || 24);
          }
          
          // Initialize selectedColor and selectedSize based on product
          if (fetchedProduct.availableColors && fetchedProduct.availableColors.length > 0) {
            setSelectedColor(fetchedProduct.availableColors[0]);
          }
          if (fetchedProduct.availableSizes && fetchedProduct.availableSizes.length > 0) {
            setSelectedSize(fetchedProduct.availableSizes[0]);
          }

        } else {
          setError('Product not found.');
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError('Failed to load product details.');
      } finally {
        setLoadingProduct(false);
      }
    };
    if (id) {
        fetchProduct();
    }
  }, [id, addProductToFirestoreHistory]);

  // Effect to update currentImage when selectedColor changes
  useEffect(() => {
    if (product && product.images && selectedColor) {
      const colorSpecificImage = product.images.find(img => img.color === selectedColor);
      if (colorSpecificImage) {
        setCurrentImage(colorSpecificImage);
      } else {
        // If no color-specific image, revert to primary (or first)
        setCurrentImage(getPrimaryImage(product.images));
      }
    } else if (product && product.images && !selectedColor) {
      // If color is deselected or not applicable, show primary
      setCurrentImage(getPrimaryImage(product.images));
    }
  }, [selectedColor, product]);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImageDataUri(reader.result as string);
      };
      reader.onerror = () => {
        toast({title: "Error Reading File", description: "Could not read the selected image.", variant: "destructive"});
        setCustomImageDataUri(null);
      }
      reader.readAsDataURL(file);
    } else {
      setCustomImageDataUri(null);
    }
  };

 useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!dragging || !previewContainerRef.current) return;

      const container = previewContainerRef.current;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dx = event.clientX - dragging.initialMouseX;
      const dy = event.clientY - dragging.initialMouseY;

      let newElementXPercent = dragging.initialElementX + (dx / rect.width) * 100;
      let newElementYPercent = dragging.initialElementY + (dy / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, newElementXPercent));
      const clampedY = Math.max(0, Math.min(100, newElementYPercent));

      if (dragging.type === 'image') {
        setImageX(clampedX);
        setImageY(clampedY);
      } else if (dragging.type === 'text') {
        setTextX(clampedX);
        setTextY(clampedY);
      }
    };

    const handleGlobalMouseUp = () => {
      setDragging(null);
      document.body.style.cursor = 'default';
    };

    if (dragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [dragging]);


  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, type: 'image' | 'text') => {
    e.preventDefault();
    if (!previewContainerRef.current) return;

    let initialElementX = 0;
    let initialElementY = 0;

    if (type === 'image') {
        initialElementX = imageX;
        initialElementY = imageY;
    } else if (type === 'text') {
        initialElementX = textX;
        initialElementY = textY;
    }

    setDragging({
      type,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      initialElementX: initialElementX,
      initialElementY: initialElementY,
    });
  };

  const handleWishlistToggle = async () => {
    if (!currentUser || !product) {
      toast({title: "Login Required", description: "Please log in to manage your wishlist.", variant: "destructive"});
      return;
    }
    if (isWishlisted(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser || !product || !currentImage) {
        toast({title: "Login Required", description: "Please log in to add items to your cart.", variant: "destructive"});
        return;
    }
    const customization: CartItemCustomization = {};
    if (selectedColor) customization.selectedColor = selectedColor;
    if (selectedSize) customization.selectedSize = selectedSize;

    if (isCustomizable(product)) {
        if (customImageDataUri && product.allowImageUpload) {
            customization.customImageDataUri = customImageDataUri;
            customization.imageX = imageX;
            customization.imageY = imageY;
            customization.imageScale = imageScale;
        }
        if (customText.trim() && product.allowTextCustomization) {
            customization.text = customText.trim();
            customization.textX = textX;
            customization.textY = textY;
            customization.textSize = textSize;
        }
    }
    // Pass the currentImage.url to be stored with the cart item
    await addToCart(product, 1, Object.keys(customization).length > 0 ? customization : undefined, currentImage.url);
    toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.` });
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Check out this product: ${product.name} - ${product.description.substring(0, 100)}...`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: 'Product Shared!', description: 'Thanks for sharing.' });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
            toast({ title: 'Could Not Share', description: 'There was an error trying to share this product.', variant: 'destructive' });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: 'Link Copied!', description: 'Product link copied to clipboard.' });
      } catch (err) {
        toast({ title: 'Sharing Not Supported', description: `Please copy the link manually: ${shareData.url}`, variant: 'destructive', duration: 7000 });
      }
    }
  };


  if (loadingProduct) {
    return (
      <div className="container py-8 md:py-12">
        <Card className="overflow-hidden shadow-lg border-border">
          <div className="grid md:grid-cols-2 gap-0">
            <Skeleton className="w-full h-[300px] sm:h-[400px] md:h-[550px] md:rounded-l-lg bg-muted" />
            <div className="p-6 md:p-10 space-y-6">
              <Skeleton className="h-6 w-1/4 bg-muted" />
              <Skeleton className="h-10 w-3/4 bg-muted" />
              <Skeleton className="h-8 w-1/3 bg-muted" />
              <Skeleton className="h-24 w-full bg-muted" />
              <div className="space-y-4 pt-4">
                <Skeleton className="h-6 w-1/5 bg-muted" />
                <Skeleton className="h-10 w-full bg-muted" />
              </div>
              <Skeleton className="h-12 w-full mt-4 bg-muted" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-8 md:py-12 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
            <Info className="h-5 w-5" />
            <AlertTitle className="text-lg">{error ? 'Error Loading Product' : 'Product Not Found'}</AlertTitle>
            <AlertDescription>{error || 'The product you are looking for does not exist or may have been removed.'}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Shop</Link>
        </Button>
      </div>
    );
  }
  
  const handleThumbnailClick = (image: ProductImage) => {
    setCurrentImage(image);
    // If the clicked thumbnail is linked to a color, also update selectedColor
    if (image.color && product.availableColors?.includes(image.color)) {
      setSelectedColor(image.color);
    }
  };


  return (
    <div className="container">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/> Back to products</Link>
        </Button>
      </div>
      <Card className="overflow-hidden shadow-xl border-border">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Display Area */}
          <div className="flex flex-col items-center p-4 md:p-6 bg-muted/30 md:rounded-l-lg">
            <div
              ref={previewContainerRef}
              className="relative w-full aspect-square max-w-lg mx-auto flex items-center justify-center overflow-hidden rounded-md border bg-background mb-4"
            >
              {currentImage && (
                <Image
                  src={currentImage.url}
                  alt={currentImage.altText || product.name}
                  fill
                  className="object-contain p-2 sm:p-4 md:p-6 pointer-events-none select-none"
                  data-ai-hint={currentImage.altText || product.dataAiHint || 'product detail'}
                  priority
                />
              )}
              {isCustomizable(product) && product.allowImageUpload && customImageDataUri && (
                <div
                  onMouseDown={(e) => handleDragStart(e, 'image')}
                  className="absolute cursor-grab active:cursor-grabbing select-none"
                  style={{
                    left: `${imageX}%`,
                    top: `${imageY}%`,
                    transform: `translate(-50%, -50%) scale(${imageScale})`,
                    maxWidth: '80%',
                    maxHeight: '80%',
                    userSelect: 'none',
                  }}
                >
                  <Image
                    src={customImageDataUri}
                    alt="Custom image preview"
                    width={300}
                    height={300}
                    className="object-contain shadow-lg rounded border-2 border-primary bg-background/50 pointer-events-none select-none"
                  />
                </div>
              )}
              {isCustomizable(product) && product.allowTextCustomization && customText.trim() && (
                  <div
                      onMouseDown={(e) => handleDragStart(e, 'text')}
                      className="absolute cursor-grab active:cursor-grabbing p-1 whitespace-pre-wrap break-words text-center select-none"
                      style={{
                          left: `${textX}%`,
                          top: `${textY}%`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${textSize}px`,
                          color: selectedColor || 'hsl(var(--foreground))',
                          maxWidth: '90%',
                          userSelect: 'none',
                      }}
                  >
                      {customText}
                  </div>
              )}
            </div>
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto py-2 w-full max-w-lg mx-auto">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(img)}
                    className={cn(
                      "h-16 w-16 sm:h-20 sm:w-20 rounded-md border-2 overflow-hidden flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      currentImage?.url === img.url ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/70"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `Product image ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Area */}
          <div className="flex flex-col">
            <CardHeader className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Badge variant="outline" className="w-fit mb-2 text-xs capitalize border-primary/50 text-primary bg-primary/10">
                    {product.category}{product.subCategory && ` / ${product.subCategory}`}
                  </Badge>
                  <Badge variant="secondary" className="w-fit mb-2 ml-2 capitalize text-xs">
                    {product.productType}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWishlistToggle}
                  disabled={loadingWishlist}
                  className={cn("rounded-full w-10 h-10", isWishlisted(product.id) ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-accent/10")}
                  aria-label={isWishlisted(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                >
                  {loadingWishlist ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-6 w-6", isWishlisted(product.id) && "fill-destructive")} /> }
                </Button>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{product.name}</CardTitle>
              <p className="text-3xl md:text-4xl font-semibold text-primary mt-3">₹{product.price.toFixed(2)}</p>
            </CardHeader>

            <CardContent className="p-6 md:p-8 pt-0 flex-grow space-y-6">
              <CardDescription className="text-base text-muted-foreground leading-relaxed">
                {product.description}
              </CardDescription>
              <Separator/>

              {(isPhysicalOrCustomizableWithPhysical(product) || product.productType === 'customized') && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-foreground">Available Options</h3>
                  {product.availableColors && product.availableColors.length > 0 && (
                    <div>
                      <Label htmlFor="color-select" className="text-sm font-medium text-foreground">Color: <span className="font-semibold text-primary">{selectedColor}</span></Label>
                       <RadioGroup
                        id="color-select"
                        value={selectedColor}
                        onValueChange={setSelectedColor}
                        className="flex flex-wrap gap-2 mt-2"
                      >
                        {product.availableColors.map(color => (
                          <Label
                            key={color}
                            htmlFor={`color-${color}`}
                            className={cn(
                              "border rounded-md p-2 px-3 cursor-pointer hover:border-primary transition-colors text-sm shadow-sm",
                              selectedColor === color && "border-primary ring-2 ring-primary bg-primary/10"
                            )}
                            style={{ backgroundColor: color.match(/^[a-zA-Z]+$/i) ? color.toLowerCase() : undefined }}
                          >
                             <RadioGroupItem value={color} id={`color-${color}`} className="sr-only" />
                            {color}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                  {product.availableSizes && product.availableSizes.length > 0 && (
                    <div>
                      <Label htmlFor="size-select" className="text-sm font-medium text-foreground">Size:</Label>
                      <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger id="size-select" className="w-full md:w-[200px] mt-1 text-sm">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.availableSizes.map(size => (
                            <SelectItem key={size} value={size} className="text-sm">{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {isCustomizable(product) && (
                <div className="space-y-6 pt-4 border-t">
                  <h3 className="text-md font-semibold text-foreground">Customize Your Product</h3>
                  {product.customizationInstructions && (
                    <Alert variant="default" className="bg-secondary/50">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">{product.customizationInstructions}</AlertDescription>
                    </Alert>
                  )}
                  {product.allowImageUpload && (
                    <div className="space-y-3">
                      <Label htmlFor="custom-image-upload" className="text-sm font-medium flex items-center gap-2 text-foreground">
                        <ImagePlus className="h-5 w-5" /> Upload Image (PNG, JPG)
                      </Label>
                      <Input
                        id="custom-image-upload"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleImageUpload}
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      {customImageDataUri && (
                        <div className="space-y-3 p-3 border rounded-md bg-muted/50">
                           <p className="text-xs text-muted-foreground">Drag image on preview to position. Use slider to scale.</p>
                            <Label htmlFor="imageScale" className="text-xs">Scale ({imageScale.toFixed(2)}x)</Label>
                            <Slider id="imageScale" min={0.1} max={3} step={0.05} value={[imageScale]} onValueChange={(val) => setImageScale(val[0])} />
                        </div>
                      )}
                       <p className="text-xs text-muted-foreground mt-1">
                        Base64 image data will be stored. Large images impact performance. Consider using Firebase Storage for production.
                      </p>
                    </div>
                  )}
                  {product.allowTextCustomization && (
                    <div className="space-y-3">
                      <Label htmlFor="custom-text" className="text-sm font-medium flex items-center gap-2 text-foreground">
                        <Type className="h-5 w-5" /> {product.textCustomizationLabel || 'Add Custom Text'}
                      </Label>
                      <Textarea
                        id="custom-text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        maxLength={product.textCustomizationMaxLength}
                        placeholder={product.textCustomizationLabel ? `Enter ${product.textCustomizationLabel.toLowerCase()}` : 'Your custom text here...'}
                        className="mt-1 text-sm"
                        rows={3}
                      />
                      {product.textCustomizationMaxLength && (
                        <p className="text-xs text-muted-foreground text-right mt-1">{customText.length}/{product.textCustomizationMaxLength}</p>
                      )}
                      {customText.trim() && (
                         <div className="space-y-3 p-3 border rounded-md bg-muted/50">
                             <p className="text-xs text-muted-foreground">Drag text on preview to position. Use slider for size.</p>
                            <Label htmlFor="textSize" className="text-xs">Font Size ({textSize}px)</Label>
                            <Slider id="textSize" min={8} max={72} step={1} value={[textSize]} onValueChange={(val) => setTextSize(val[0])} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isDigital(product) && (
                <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-md font-semibold text-foreground">Digital Download Details</h3>
                    {product.fileFormat && <p className="text-sm text-muted-foreground">Format: <Badge variant="outline">{product.fileFormat}</Badge></p>}
                    {product.downloadUrl && (
                        <Alert variant="default" className="bg-green-50 border-green-200 text-green-700">
                            <Download className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Instant Access After Purchase</AlertTitle>
                            <AlertDescription className="text-sm">
                                This is a digital product. After successful payment, you'll receive access to the download link on your order confirmation page.
                            </AlertDescription>
                        </Alert>
                    )}
                     {!product.downloadUrl && (
                        <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Temporarily Unavailable</AlertTitle>
                            <AlertDescription className="text-sm">
                                Download information for this product is currently unavailable. It cannot be purchased at this time.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
              )}

              {product.keywords && product.keywords.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-foreground mb-2">Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.keywords.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-xs">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col items-center p-4 md:p-6 pt-0 mt-auto">
              <Separator className="mb-4 w-full" />
              <div className="flex flex-col items-center sm:flex-row sm:justify-center gap-3 w-full">
                <Button
                    onClick={handleAddToCart}
                    size="default"
                    className="w-full max-w-[240px] sm:max-w-none sm:flex-1 sm:min-w-0 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
                    aria-label={`Add ${product.name} to cart`}
                    disabled={!currentUser || (isDigital(product) && !product.downloadUrl)}
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isDigital(product) ? 'Add to Cart to Purchase' : 'Add to Cart'}
                </Button>
                 <Button
                    onClick={handleShare}
                    size="default"
                    variant="outline"
                    className="w-full max-w-[240px] sm:max-w-none sm:w-auto sm:flex-none sm:min-w-0"
                    aria-label="Share this product"
                  >
                    <Share2 className="mr-2 h-5 w-5" /> Share
                  </Button>
              </div>
                {!currentUser && <p className="text-xs text-destructive text-center mt-3">Please log in to make purchases or add to cart.</p>}
                {isDigital(product) && !product.downloadUrl && currentUser && (
                    <p className="text-xs text-destructive text-center mt-3">This digital product is currently unavailable for purchase.</p>
                )}
            </CardFooter>
          </div>
        </div>
      </Card>
      <RecommendationsSection />
    </div>
  );
}
