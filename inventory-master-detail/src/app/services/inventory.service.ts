import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category?: string;
  unitPrice?: number;
  quantity: number;
  imageUrl?: string; // optional URL to an image for the product
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  // Bypass proxy for debugging; call API directly
private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }

  // Backwards-compatible alias used by some legacy components
  getProduct(id: number) {
    return this.get(id);
  }

  setQuantity(id: number, quantity: number) {
    return this.http.put(`${this.base}/products/${id}/quantity`, { quantity });
  }

  // Backwards-compatible alias used by product-detail component
  updateQuantity(id: number, quantity: number, _location?: string) {
    // server currently ignores location; kept for API compatibility
    return this.setQuantity(id, quantity);
  }
  create(p: { sku: string; name: string; category: string; unitPrice: number; quantity?: number; imageUrl?: string; description?: string } | FormData) {
    // If FormData is passed, post as multipart/form-data (for file upload)
    if (p instanceof FormData) {
      return this.http.post<Product>(`${this.base}/products`, p);
    }
    return this.http.post<Product>(`${this.base}/products`, p);
  }
remove(id: number) {
  return this.http.delete(`${this.base}/products/${id}`);
}

}

