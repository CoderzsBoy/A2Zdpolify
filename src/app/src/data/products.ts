
import type { Product } from '@/types';

// This file is now a placeholder or can be used for seeding your Firestore database.
// Product data should be fetched from Firestore.

export const products_DEPRECATED_USE_FIRESTORE: Product[] = [
  {
    id: '1',
    name: 'Modern Lavender Lamp',
    description: 'A stylish table lamp with a soft lavender hue, perfect for creating a calming ambiance. Features a sleek metal base and a fabric shade.',
    price: 79.99,
    image: 'https://placehold.co/800x600.png', 
    dataAiHint: 'modern lamp',
    category: 'Home Decor',
    subCategory: 'Lighting',
    keywords: ['lamp', 'lavender', 'modern', 'lighting', 'home decor'],
    productType: 'physical',
    availableColors: ['Lavender Bliss', 'Classic White', 'Minimalist Gray'],
    availableSizes: ['Small', 'Medium', 'Large'],
  },
  // ... other products from your original file
  // Ensure these match the structure you'll use in Firestore
];

// To populate Firestore, you can use the Firebase Admin SDK in a script
// or manually add documents to your 'products' collection in the Firebase console
// using the structure defined in src/types/index.ts for the Product type.
