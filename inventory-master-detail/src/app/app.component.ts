import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, Product } from './services/inventory.service';

@Component({
  selector: 'app-root',
  standalone: true,
   imports: [NgIf, NgFor, FormsModule, CurrencyPipe],
  styles: [`
    .wrap { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
    .panel { background:#fff; border:1px solid #eee; border-radius:12px; padding:16px; }
    .list { list-style:none; margin:0; padding:0; }
    .item { padding:12px 10px; border-bottom:1px solid #f0f0f0; cursor:pointer; border-radius:10px; }
    .item:hover { background:#fafafa; }
    .selected { outline:2px solid #4c9ffe; background:#f3f8ff; }
    .name { font-weight:700; }
    .sub { color:#666; font-size:14px; }
    .stock { color:#333; font-size:14px; }
    .search { width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:10px; }
    .muted { color:#888; }
    .row { display:flex; gap:12px; align-items:center; margin-top:8px; }
    button { padding:8px 12px; border-radius:8px; border:1px solid #ddd; cursor:pointer; }
    button:hover { background:#f6f6f6; }
    .qty-input { width:120px; padding:8px; border:1px solid #ddd; border-radius:8px; }
  `],
  template: `
  <h1>Inventory Master-Detail</h1>

  <div class="wrap">
    <!-- Master -->
    <div class="panel">
      <input class="search" placeholder="Search by name, SKU, category…"
             [(ngModel)]="query" (input)="applyFilter()" />

      <!-- ⬇️ INSERTED: Add item toggle + form -->
      <button (click)="showAdd = !showAdd">{{ showAdd ? 'Close' : 'Add item' }}</button>

      <div *ngIf="showAdd" class="panel" style="margin-top:10px; padding:12px;">
        <div class="row"><input class="qty-input" placeholder="SKU" [(ngModel)]="newItem.sku" /></div>
        <div class="row"><input class="qty-input" placeholder="Name" [(ngModel)]="newItem.name" /></div>
        <div class="row"><input class="qty-input" placeholder="Category" [(ngModel)]="newItem.category" /></div>
        <div class="row"><input class="qty-input" type="number" placeholder="Unit Price" [(ngModel)]="newItem.unitPrice" /></div>
        <div class="row"><input class="qty-input" type="number" placeholder="Initial Qty (optional)" [(ngModel)]="newItem.quantity" /></div>
        <div class="row">
          <button (click)="addItem()">Create</button>
        </div>
      </div>
      <!-- ⬆️ END INSERT -->

      <div class="muted" style="margin-top:8px">{{ filtered.length }} items</div>

      <ul class="list" style="margin-top:10px">
        <li *ngFor="let p of filtered"
            class="item"
            [class.selected]="p.id === selected?.id"
            (click)="select(p)">
          <div class="name">{{ p.name }}</div>
          <div class="sub">SKU {{ p.sku }} • {{ p.category }}</div>
          <div class="stock">Stock: {{ p.quantity }}</div>
        </li>
      </ul>

      <div *ngIf="loading" class="muted">Loading…</div>
      <div *ngIf="error" style="color:#c00">{{ error }}</div>
    </div>

    <!-- Detail -->
    <div class="panel">
      <ng-container *ngIf="selected as s; else blank">
        <h2 style="margin-top:0">{{ s.name }}</h2>
        <div class="sub">SKU {{ s.sku }} • {{ s.category }}</div>
        <p style="margin-top:10px">
          <b>Unit Price:</b> {{ s.unitPrice | currency:'USD':'symbol':'1.2-2' }}
        </p>
        <p><b>Current Stock:</b> {{ s.quantity }}</p>

        <div class="row">
          <input class="qty-input" type="number" [(ngModel)]="newQty" placeholder="New qty" />
          <button (click)="saveQty()" [disabled]="newQty===null || newQty===undefined">
            Update quantity
            <button (click)="deleteSelected()" [disabled]="!selected">Delete item</button>
          </button>
          <span *ngIf="saving" class="muted">Saving…</span>
        </div>
        <div *ngIf="detailError" style="color:#c00; margin-top:8px">{{ detailError }}</div>
      </ng-container>

      <ng-template #blank>
        <div class="muted" style="margin-top:40px; text-align:center">
          Select an item to see details.
        </div>
      </ng-template>
    </div>
  </div>


  `
})
export class AppComponent implements OnInit {
  products: Product[] = [];
  filtered: Product[] = [];
  selected?: Product;

  showAdd = false;
  newItem = { sku: '', name: '', category: '', unitPrice: null as number | null, quantity: null as number | null };

addItem() {
  const { sku, name, category, unitPrice, quantity } = this.newItem;
  if (!sku || !name || category === '' || unitPrice == null) return;
  this.inv.create({
    sku, name, category,
    unitPrice: Number(unitPrice),
    quantity: quantity != null ? Number(quantity) : undefined
  }).subscribe({
    next: created => {
      this.showAdd = false;
      this.newItem = { sku: '', name: '', category: '', unitPrice: null, quantity: null };
      this.loadList();
      this.select(created); // focus new item
    },
    error: err => {
      console.error(err);
      this.error = 'Failed to create item';
    }
  });
}

deleteSelected() {
  if (!this.selected) return;
  const ok = confirm(`Delete "${this.selected.name}"? This cannot be undone.`);
  if (!ok) return;

  this.inv.remove(this.selected.id).subscribe({
    next: () => {
      this.selected = undefined;
      this.loadList();
    },
    error: err => {
      console.error(err);
      this.detailError = 'Failed to delete item';
    }
  });
}
  loading = true;
  error = '';
  detailError = '';
  saving = false;

  query = '';
  newQty?: number;

  constructor(private inv: InventoryService) {}

  ngOnInit(): void {
    this.loadList();
  }

  loadList() {
    this.loading = true;
    this.inv.list().subscribe({
      next: rows => {
        this.products = rows;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load products';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    const q = this.query.trim().toLowerCase();
    this.filtered = !q ? [...this.products] :
      this.products.filter(p =>
        (p.name?.toLowerCase().includes(q)) ||
        (p.sku?.toLowerCase().includes(q)) ||
        (p.category?.toLowerCase().includes(q))
      );
    // keep selection if still visible; otherwise clear
    if (this.selected && !this.filtered.find(p => p.id === this.selected!.id)) {
      this.selected = undefined;
    }
  }

  select(p: Product) {
    this.detailError = '';
    // fetch latest detail (same shape as list for now)
    this.inv.get(p.id).subscribe({
      next: d => {
        this.selected = d;
        this.newQty = d.quantity;
      },
      error: err => {
        console.error(err);
        this.detailError = 'Failed to load item details';
      }
    });
  }

  saveQty() {
    if (!this.selected || this.newQty == null) return;
    this.saving = true;
    this.inv.setQuantity(this.selected.id, Number(this.newQty)).subscribe({
      next: () => {
        // refresh detail and list so UI stays in sync
        this.select(this.selected!);
        this.loadList();
        this.saving = false;
      },
      error: err => {
        console.error(err);
        this.detailError = 'Failed to update quantity';
        this.saving = false;
      }
    });
  }
}
