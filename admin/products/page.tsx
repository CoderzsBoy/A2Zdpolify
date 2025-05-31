
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Product, ProductImage, PhysicalProductSpecifics, CustomizedProductSpecifics, DigitalProductSpecifics } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, Edit2, Trash2, ImagePlus, X, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

const productSpecificsSchema = z.object({
  availableColors: z.array(z.string()).optional(),
  availableSizes: z.array(z.string()).optional(),
  allowImageUpload: z.boolean().optional(),
  customizationInstructions: z.string().optional(),
  allowTextCustomization: z.boolean().optional(),
  textCustomizationLabel: z.string().optional(),
  textCustomizationMaxLength: z.number().optional(),
  defaultImageX: z.number().optional(),
  defaultImageY: z.number().optional(),
  defaultImageScale: z.number().optional(),
  defaultTextX: z.number().optional(),
  defaultTextY: z.number().optional(),
  defaultTextSize: z.number().optional(),
  fileFormat: z.string().optional(),
  downloadUrl: z.string().url({ message: "Invalid URL for download link" }).optional().or(z.literal('')),
});

const productImageSchema = z.object({
  url: z.string().url({ message: "Image URL must be a valid URL." }).min(1, "Image URL is required."),
  altText: z.string().optional(),
  color: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, "Price must be a positive number.")
  ),
  category: z.string().min(1, "Category is required."),
  subCategory: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  dataAiHint: z.string().optional(),
  productType: z.enum(['physical', 'customized', 'digital']),
  images: z.array(productImageSchema).min(1, "At least one image is required."),
}).merge(productSpecificsSchema);


type ProductFormData = z.infer<typeof productFormSchema>;

const CLOUDINARY_CLOUD_NAME = "dlgpwihpq";
const CLOUDINARY_UPLOAD_PRESET = "my_admin_uploads"; // Updated preset name

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const [fileUploadMessages, setFileUploadMessages] = useState<Record<number, string | null>>({});
  const [isUploading, setIsUploading] = useState<Record<number, boolean>>({});


  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      subCategory: '',
      keywords: [],
      dataAiHint: '',
      productType: 'physical',
      images: [{ url: '', altText: '', color: '', isPrimary: true }],
      availableColors: [],
      availableSizes: [],
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const { fields: keywordFields, append: appendKeyword, remove: removeKeyword } = useFieldArray({
    control: form.control,
    name: "keywords",
  });
  
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control: form.control,
    name: "availableColors",
  });

  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
    control: form.control,
    name: "availableSizes",
  });


  const productType = form.watch('productType');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products: ", error);
      toast({ title: "Error", description: "Failed to fetch products.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [toast]);

  const handleDialogOpen = (product?: Product) => {
    setFileUploadMessages({});
    setIsUploading({});
    if (product) {
      setEditingProduct(product);
      const keywords = Array.isArray(product.keywords) ? product.keywords : (product.keywords ? [String(product.keywords)] : []);
      const availableColors = Array.isArray((product as PhysicalProductSpecifics).availableColors) ? (product as PhysicalProductSpecifics).availableColors : [];
      const availableSizes = Array.isArray((product as PhysicalProductSpecifics).availableSizes) ? (product as PhysicalProductSpecifics).availableSizes : [];
      
      form.reset({
        ...product,
        keywords,
        availableColors,
        availableSizes,
        images: product.images?.length > 0 ? product.images : [{ url: '', altText: '', color: '', isPrimary: true }],
        ...(product.productType === 'customized' ? (product as CustomizedProductSpecifics) : {}),
        ...(product.productType === 'digital' ? (product as DigitalProductSpecifics) : {}),
      });
    } else {
      setEditingProduct(null);
      form.reset({
        name: '', description: '', price: 0, category: '', subCategory: '',
        keywords: [], dataAiHint: '', productType: 'physical',
        images: [{ url: '', altText: '', color: '', isPrimary: true }],
        availableColors: [], availableSizes: [],
        allowImageUpload: false, customizationInstructions: '', allowTextCustomization: false,
        textCustomizationLabel: '', textCustomizationMaxLength: 0,
        defaultImageX: 50, defaultImageY: 50, defaultImageScale: 1,
        defaultTextX: 50, defaultTextY: 10, defaultTextSize: 24,
        fileFormat: '', downloadUrl: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleImageFileSelected = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileUploadMessages(prev => ({ ...prev, [index]: null }));
      return;
    }

    if (CLOUDINARY_UPLOAD_PRESET === "YOUR_UNSIGNED_CLOUDINARY_UPLOAD_PRESET") { // This check will now be false
      toast({
        title: "Configuration Needed",
        description: "Please replace 'YOUR_UNSIGNED_CLOUDINARY_UPLOAD_PRESET' in the code with your actual Cloudinary upload preset name.",
        variant: "destructive",
        duration: 7000,
      });
      setFileUploadMessages(prev => ({ ...prev, [index]: "Cloudinary preset not configured." }));
      return;
    }

    setIsUploading(prev => ({ ...prev, [index]: true }));
    setFileUploadMessages(prev => ({ ...prev, [index]: `Uploading ${file.name}...` }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Cloudinary upload failed with status ${response.status}`);
      }

      const data = await response.json();
      const secureUrl = data.secure_url;

      form.setValue(`images.${index}.url`, secureUrl);
      form.setValue(`images.${index}.altText`, file.name); 
      setFileUploadMessages(prev => ({ ...prev, [index]: `Upload successful! ${file.name}` }));
      toast({ title: "Image Uploaded", description: `${file.name} uploaded to Cloudinary.` });

    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      toast({ title: "Upload Failed", description: error.message || "Could not upload image to Cloudinary.", variant: "destructive" });
      setFileUploadMessages(prev => ({ ...prev, [index]: "Upload failed. Please try again or enter URL manually." }));
      form.setValue(`images.${index}.url`, ''); 
    } finally {
      setIsUploading(prev => ({ ...prev, [index]: false }));
      if (event.target) {
        event.target.value = '';
      }
    }
  };


  const onSubmit = async (data: ProductFormData) => {
    try {
      const hasPrimaryImage = data.images.some(img => img.isPrimary);
      if (!hasPrimaryImage && data.images.length > 0) {
        data.images[0].isPrimary = true;
      }

      let productData: any = { ...data };
      
      if (data.productType !== 'physical' && data.productType !== 'customized') {
        delete productData.availableColors;
        delete productData.availableSizes;
      }
      if (data.productType !== 'customized') {
        delete productData.allowImageUpload;
        delete productData.customizationInstructions;
        delete productData.allowTextCustomization;
        delete productData.textCustomizationLabel;
        delete productData.textCustomizationMaxLength;
        delete productData.defaultImageX;
        delete productData.defaultImageY;
        delete productData.defaultImageScale;
        delete productData.defaultTextX;
        delete productData.defaultTextY;
        delete productData.defaultTextSize;
      }
      if (data.productType !== 'digital') {
        delete productData.fileFormat;
        delete productData.downloadUrl;
      }
      productData.price = Number(data.price);
      if (data.textCustomizationMaxLength) productData.textCustomizationMaxLength = Number(data.textCustomizationMaxLength);
      if (data.defaultImageX) productData.defaultImageX = Number(data.defaultImageX);
      if (data.defaultImageY) productData.defaultImageY = Number(data.defaultImageY);
      if (data.defaultImageScale) productData.defaultImageScale = Number(data.defaultImageScale);
      if (data.defaultTextX) productData.defaultTextX = Number(data.defaultTextX);
      if (data.defaultTextY) productData.defaultTextY = Number(data.defaultTextY);
      if (data.defaultTextSize) productData.defaultTextSize = Number(data.defaultTextSize);



      if (editingProduct) {
        await setDoc(doc(db, 'products', editingProduct.id), productData, { merge: true });
        toast({ title: "Success", description: "Product updated successfully." });
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, productData);
        toast({ title: "Success", description: "Product added successfully." });
      }
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product: ", error);
      toast({ title: "Error", description: "Failed to save product.", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast({ title: "Success", description: "Product deleted successfully." });
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product: ", error);
        toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Manage Products</h1>
        <Button onClick={() => handleDialogOpen()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the details of this product.' : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Name</Label><Input id="name" {...form.register('name')} />{form.formState.errors.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>}</div>
              <div><Label htmlFor="price">Price (₹)</Label><Input id="price" type="number" step="0.01" {...form.register('price')} />{form.formState.errors.price && <p className="text-xs text-destructive mt-1">{form.formState.errors.price.message}</p>}</div>
            </div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" {...form.register('description')} rows={3} />{form.formState.errors.description && <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label htmlFor="category">Category</Label><Input id="category" {...form.register('category')} />{form.formState.errors.category && <p className="text-xs text-destructive mt-1">{form.formState.errors.category.message}</p>}</div>
              <div><Label htmlFor="subCategory">Sub-Category (Optional)</Label><Input id="subCategory" {...form.register('subCategory')} /></div>
              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Controller
                    name="productType"
                    control={form.control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="physical">Physical</SelectItem>
                            <SelectItem value="customized">Customized</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                />
                 {form.formState.errors.productType && <p className="text-xs text-destructive mt-1">{form.formState.errors.productType.message}</p>}
              </div>
            </div>
            
            {/* Images Array */}
            <div className="space-y-3 p-4 border rounded-md">
              <Label className="text-md font-medium">Product Images</Label>
              {imageFields.map((field, index) => (
                <div key={field.id} className="space-y-2 p-3 border rounded bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor={`images.${index}.url`}>Image URL</Label>
                        <Input id={`images.${index}.url`} {...form.register(`images.${index}.url`)} placeholder="Enter URL or upload below" />
                        {form.formState.errors.images?.[index]?.url && <p className="text-xs text-destructive mt-1">{form.formState.errors.images?.[index]?.url?.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor={`images.${index}.file`}>Upload Image File</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                id={`images.${index}.file`} 
                                type="file" 
                                accept="image/*" 
                                className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 flex-grow"
                                onChange={(e) => handleImageFileSelected(e, index)}
                                disabled={isUploading[index]}
                            />
                            {isUploading[index] && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        </div>
                         {fileUploadMessages[index] && <p className="text-xs text-muted-foreground mt-1">{fileUploadMessages[index]}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label htmlFor={`images.${index}.altText`}>Alt Text (Optional)</Label><Input id={`images.${index}.altText`} {...form.register(`images.${index}.altText`)} /></div>
                     <div><Label htmlFor={`images.${index}.color`}>Linked Color (Optional)</Label><Input id={`images.${index}.color`} placeholder="e.g., Black" {...form.register(`images.${index}.color`)} /></div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                      <Controller name={`images.${index}.isPrimary`} control={form.control} render={({ field }) => (<Checkbox id={`images.${index}.isPrimary`} checked={field.value} onCheckedChange={field.onChange} />)} />
                      <Label htmlFor={`images.${index}.isPrimary`} className="text-sm font-normal">Is Primary Image?</Label>
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(index)} className="mt-1"><Trash2 className="mr-1 h-3 w-3"/> Remove Image Entry</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => {appendImage({ url: '', altText: '', color: '', isPrimary: imageFields.length === 0 }); setFileUploadMessages(prev => ({...prev, [imageFields.length]: null})); setIsUploading(prev => ({...prev, [imageFields.length]: false})); }}><ImagePlus className="mr-2 h-4 w-4"/>Add Image Entry</Button>
               {form.formState.errors.images && typeof form.formState.errors.images === 'object' && !Array.isArray(form.formState.errors.images) && <p className="text-xs text-destructive mt-1">{form.formState.errors.images.message}</p>}
            </div>

            {/* Keywords */}
            <div className="space-y-2 p-3 border rounded-md">
                <Label className="text-md font-medium">Keywords (Optional)</Label>
                {keywordFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                    <Input {...form.register(`keywords.${index}` as any)} placeholder="e.g., t-shirt" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeKeyword(index)} className="text-destructive"><X className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendKeyword('')}>Add Keyword</Button>
            </div>
             <div><Label htmlFor="dataAiHint">AI Image Hint (Optional)</Label><Input id="dataAiHint" {...form.register('dataAiHint')} placeholder="e.g., modern lamp"/></div>


            {/* Physical/Customized Specifics */}
            {(productType === 'physical' || productType === 'customized') && (
              <div className="space-y-4 p-4 border rounded-md bg-secondary/20">
                <h3 className="text-md font-semibold">Physical/Customization Options</h3>
                <div className="space-y-2">
                    <Label>Available Colors (Optional)</Label>
                    {colorFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`availableColors.${index}` as any)} placeholder="e.g., Midnight Black" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeColor(index)} className="text-destructive"><X className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendColor('')}>Add Color</Button>
                </div>
                <div className="space-y-2">
                    <Label>Available Sizes (Optional)</Label>
                    {sizeFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`availableSizes.${index}` as any)} placeholder="e.g., Large" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSize(index)} className="text-destructive"><X className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSize('')}>Add Size</Button>
                </div>
              </div>
            )}

            {/* Customized Specifics */}
            {productType === 'customized' && (
              <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                <h3 className="text-md font-semibold">Customization Settings</h3>
                <div className="flex items-center gap-2"><Controller name="allowImageUpload" control={form.control} render={({ field }) => (<Checkbox id="allowImageUpload" checked={field.value} onCheckedChange={field.onChange} />)} /><Label htmlFor="allowImageUpload" className="font-normal">Allow Image Upload</Label></div>
                <div><Label htmlFor="customizationInstructions">Customization Instructions</Label><Textarea id="customizationInstructions" {...form.register('customizationInstructions')} /></div>
                <div className="flex items-center gap-2"><Controller name="allowTextCustomization" control={form.control} render={({ field }) => (<Checkbox id="allowTextCustomization" checked={field.value} onCheckedChange={field.onChange} />)} /><Label htmlFor="allowTextCustomization" className="font-normal">Allow Text Customization</Label></div>
                <div><Label htmlFor="textCustomizationLabel">Text Customization Label</Label><Input id="textCustomizationLabel" {...form.register('textCustomizationLabel')} /></div>
                <div><Label htmlFor="textCustomizationMaxLength">Text Max Length</Label><Input id="textCustomizationMaxLength" type="number" {...form.register('textCustomizationMaxLength')} /></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div><Label>Default Image X%</Label><Input type="number" {...form.register('defaultImageX')} /></div>
                    <div><Label>Default Image Y%</Label><Input type="number" {...form.register('defaultImageY')} /></div>
                    <div><Label>Default Image Scale</Label><Input type="number" step="0.1" {...form.register('defaultImageScale')} /></div>
                    <div><Label>Default Text X%</Label><Input type="number" {...form.register('defaultTextX')} /></div>
                    <div><Label>Default Text Y%</Label><Input type="number" {...form.register('defaultTextY')} /></div>
                    <div><Label>Default Text Size (px)</Label><Input type="number" {...form.register('defaultTextSize')} /></div>
                </div>
              </div>
            )}

            {/* Digital Specifics */}
            {productType === 'digital' && (
              <div className="space-y-4 p-4 border rounded-md bg-secondary/40">
                <h3 className="text-md font-semibold">Digital Product Settings</h3>
                <div><Label htmlFor="fileFormat">File Format (e.g., PDF, ZIP)</Label><Input id="fileFormat" {...form.register('fileFormat')} /></div>
                <div><Label htmlFor="downloadUrl">Download URL (Protected link recommended)</Label><Input id="downloadUrl" type="url" {...form.register('downloadUrl')} />{form.formState.errors.downloadUrl && <p className="text-xs text-destructive mt-1">{form.formState.errors.downloadUrl.message}</p>}</div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || Object.values(isUploading).some(s => s)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {form.formState.isSubmitting || Object.values(isUploading).some(s => s) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingProduct ? 'Save Changes' : 'Add Product')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[150px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No products found.</TableCell></TableRow>
            )}
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Image
                    src={product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || 'https://placehold.co/60x60.png'}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="rounded object-cover aspect-square border"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="capitalize">{product.productType}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                <TableCell className="text-center space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleDialogOpen(product)} className="h-8 w-8 hover:text-primary hover:border-primary">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDeleteProduct(product.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:border-destructive/80 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


    