export interface Product {
  id: number;
  sku: string;
  name: string;
  quantity: number;   // from LEFT JOIN
  imageUrl?: string; // optional product image URL
  description?: string;
}

export interface ProductDetail extends Product {
  description?: string;
  location?: string | null;
}
