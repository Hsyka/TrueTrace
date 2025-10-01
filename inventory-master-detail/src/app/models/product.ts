export interface Product {
  id: number;
  sku: string;
  name: string;
  quantity: number;   // from LEFT JOIN
}

export interface ProductDetail extends Product {
  description?: string;
  location?: string | null;
}
