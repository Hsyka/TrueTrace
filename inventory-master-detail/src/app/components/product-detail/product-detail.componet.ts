import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { ProductDetail } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  product?: ProductDetail;
  loading = true;
  error = '';

  quantityInput?: number;
  locationInput?: string;

  constructor(private route: ActivatedRoute, private inv: InventoryService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.inv.getProduct(id).subscribe({
      next: (data) => { this.product = data; this.loading = false; },
      error: () => { this.error = 'Failed to load product'; this.loading = false; }
    });
  }

  saveQuantity() {
    if (!this.product) return;
    const qty = Number(this.quantityInput ?? this.product.quantity);
    this.inv.updateQuantity(this.product.id, qty, this.locationInput).subscribe({
      next: () => this.inv.getProduct(this.product!.id).subscribe(p => this.product = p),
      error: () => this.error = 'Failed to update quantity'
    });
  }
}
