
"use client";

import type { Product } from '@/types';
import ProductCard from './ProductCard';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react'; // Added Inbox icon

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  const searchParams = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  useEffect(() => {
    const searchTerm = searchParams.get('q')?.toLowerCase() || '';
    if (searchTerm) {
      setFilteredProducts(
        products.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm) ||
          (product.subCategory && product.subCategory.toLowerCase().includes(searchTerm)) ||
          (product.keywords && product.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)))
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchParams, products]);

  if (products.length === 0) { // Check original products length for "no products available"
    return (
      <div className="text-center py-16">
        <Inbox className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">No products available at the moment.</p>
        <p className="text-sm text-muted-foreground mt-2">Please check back later!</p>
      </div>
    );
  }
  
  if (filteredProducts.length === 0) { // This means search yielded no results
    return (
      <div className="text-center py-16">
        <Inbox className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">No products found matching your search.</p>
        <p className="text-sm text-muted-foreground mt-2">Try a different search term or browse all products.</p>
      </div>
    );
  }


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8"> {/* Adjusted grid for wider cards */}
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

