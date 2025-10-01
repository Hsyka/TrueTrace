import { Component, OnInit } from '@angular/core';
import { InventoryService, Product } from '../../services/inventory.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  error = '';

  constructor(private inv: InventoryService) {}

  ngOnInit(): void {
    this.inv.list().subscribe({
      next: rows => { console.log('API rows:', rows); this.products = rows; this.loading = false; },
      error: err => { console.error(err); this.error = 'Failed to load products'; this.loading = false; }
    });
  }
}
