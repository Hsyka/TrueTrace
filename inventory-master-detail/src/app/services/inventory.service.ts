import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
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

  setQuantity(id: number, quantity: number) {
    return this.http.put(`${this.base}/products/${id}/quantity`, { quantity });
  }
  create(p: { sku: string; name: string; category: string; unitPrice: number; quantity?: number; }) {
  return this.http.post<Product>(`${this.base}/products`, p);
}
remove(id: number) {
  return this.http.delete(`${this.base}/products/${id}`);
}

}

