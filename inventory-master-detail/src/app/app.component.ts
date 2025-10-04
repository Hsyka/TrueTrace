import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, Product } from './services/inventory.service';

@Component({
  selector: 'app-root',
  standalone: true,
   imports: [NgIf, NgFor, FormsModule, CurrencyPipe],
  styles: [``],
  template: `
  <div class="app-container">
    <header class="app-header">
      <div class="app-logo">TT</div>
      <div>
        <div class="app-title">True Trace Inventory</div>
        <div class="app-subtitle">Manage products and stock — simple demo</div>
      </div>

      <!-- header right area intentionally left empty (no top-right search) -->
    </header>

    <main class="wrap" style="display:grid; grid-template-columns:360px 1fr; gap:24px;">
      <!-- Master -->
      <div class="card">
        <div style="display:flex; gap:8px; align-items:center;">
          <input class="search" placeholder="Search by name, SKU, category…"
                 [(ngModel)]="query" (input)="applyFilter()" />
          <button class="btn btn-primary" (click)="showAdd = !showAdd">{{ showAdd ? 'Close' : 'Add item' }}</button>
        </div>

        <div *ngIf="showAdd" class="card mt-12">
          <div class="form-row"><input placeholder="SKU" [(ngModel)]="newItem.sku" /></div>
          <div class="form-row mt-12"><input placeholder="Name" [(ngModel)]="newItem.name" /></div>
          <div class="form-row mt-12"><input placeholder="Category" [(ngModel)]="newItem.category" /></div>
          <div class="form-row mt-12"><input type="number" placeholder="Unit Price" [(ngModel)]="newItem.unitPrice" /></div>
          <div class="form-row mt-12"><input type="number" placeholder="Initial Qty (optional)" [(ngModel)]="newItem.quantity" /></div>
          <div class="form-row mt-12">
            <input type="file" accept="image/*" (change)="onFileChange($event)" />
          </div>
          <div *ngIf="previewUrl" style="margin-top:8px"><img [src]="previewUrl" alt="preview" style="max-width:180px;border-radius:8px" /></div>
          <div class="form-row mt-12"><input placeholder="Image URL (optional)" [(ngModel)]="newItem.imageUrl" /></div>
          <div class="form-row mt-12"><input placeholder="Short description (optional)" [(ngModel)]="newItem.description" /></div>
          <div class="row mt-12"><button class="btn btn-primary" (click)="addItem()">Create</button></div>
        </div>

        <div class="muted mt-12">{{ filtered.length }} items</div>

        <ul class="list mt-12">
          <li *ngFor="let p of filtered"
              class="item"
              [class.selected]="p.id === selected?.id"
              (click)="select(p)"
              style="padding:12px; border-bottom:1px solid rgba(16,32,59,0.04);">
            <div class="name">{{ p.name }}</div>
            <div class="sub">SKU {{ p.sku }} • {{ p.category }}</div>
            <div class="stock">Stock: {{ p.quantity }}</div>
          </li>
        </ul>

        <div *ngIf="loading" class="muted">Loading…</div>
        <div *ngIf="error" style="color:#c00">{{ error }}</div>
      </div>

      <!-- Detail -->
      <div class="card">
        <ng-container *ngIf="selected as s; else blank">
          <div class="space-between">
            <div>
              <h2 style="margin:0">{{ s.name }}</h2>
              <div class="app-subtitle">SKU {{ s.sku }} • {{ s.category }}</div>
            </div>
            <div>
              <button class="btn btn-ghost" (click)="selected = undefined">Close</button>
            </div>
          </div>
          <div class="row mt-12" style="gap:18px; align-items:flex-start">
            <div style="min-width:140px; max-width:220px;">
              <img *ngIf="s.imageUrl; else noImage" [src]="s.imageUrl" alt="{{s.name}}" style="width:100%; height:auto; border-radius:8px; object-fit:cover;" />
              <ng-template #noImage>
                <div style="width:100%; height:140px; border-radius:8px; background:linear-gradient(180deg,#f6f8ff,#fff); display:flex;align-items:center;justify-content:center;color:var(--muted)">No image</div>
              </ng-template>
            </div>
            <div style="flex:1">
              <p class="mt-0"><b>Unit Price:</b> {{ s.unitPrice | currency:'USD':'symbol':'1.2-2' }}</p>
              <p><b>Current Stock:</b> {{ s.quantity }}</p>
              <p *ngIf="s.description" class="muted">{{ s.description }}</p>
            </div>
          </div>
          <p><b>Current Stock:</b> {{ s.quantity }}</p>

          <div class="form-row mt-12">
            <input class="qty-input" type="number" [(ngModel)]="newQty" placeholder="New qty" />
            <button class="btn btn-primary" (click)="saveQty()" [disabled]="newQty===null || newQty===undefined">Update quantity</button>
            <button class="btn btn-danger" (click)="deleteSelected()" [disabled]="!selected">Delete</button>
          </div>
          <span *ngIf="saving" class="muted">Saving…</span>

          <div *ngIf="detailError" style="color:#c00; margin-top:8px">{{ detailError }}</div>
        </ng-container>

        <ng-template #blank>
          <div class="muted" style="margin-top:40px; text-align:center">Select an item to see details.</div>
        </ng-template>
      </div>
    </main>
  </div>
  `
})
export class AppComponent implements OnInit {
  products: Product[] = [];
  filtered: Product[] = [];
  selected?: Product;

  showAdd = false;
  newItem: any = { sku: '', name: '', category: '', unitPrice: null as number | null, quantity: null as number | null, imageUrl: '', description: '' };

  selectedFile?: File | null = null;
  previewUrl?: string | null = null;

  onFileChange(e: Event) {
    const inp = e.target as HTMLInputElement;
    const f = inp.files && inp.files[0];
    if (f) {
      this.selectedFile = f;
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result as string; };
      reader.readAsDataURL(f);
    } else {
      this.selectedFile = null; this.previewUrl = null;
    }
  }

  addItem() {
  const { sku, name, category, unitPrice, quantity, imageUrl, description } = this.newItem;
  if (!sku || !name || category === '' || unitPrice == null) return;

  if (this.selectedFile) {
    const fd = new FormData();
    fd.append('sku', sku);
    fd.append('name', name);
    fd.append('category', category);
    fd.append('unitPrice', String(unitPrice));
    if (quantity != null) fd.append('quantity', String(quantity));
    if (description) fd.append('description', description);
    // If user also typed an imageUrl, include it as fallback
    if (imageUrl) fd.append('imageUrl', imageUrl);
    fd.append('image', this.selectedFile as Blob, this.selectedFile!.name);

    this.inv.create(fd).subscribe({
      next: created => {
        this.showAdd = false;
        this.newItem = { sku: '', name: '', category: '', unitPrice: null, quantity: null, imageUrl: '', description: '' };
        this.selectedFile = null; this.previewUrl = null;
        this.loadList();
        this.select(created); // focus new item
      },
      error: err => {
        console.error('Create (form) failed:', err);
        this.error = err?.error?.message || err?.message || 'Failed to create item';
      }
    });
    return;
  }

  // No file -> JSON path
  this.inv.create({
    sku, name, category,
    unitPrice: Number(unitPrice),
    quantity: quantity != null ? Number(quantity) : undefined,
    imageUrl: imageUrl || undefined,
    description: description || undefined
  }).subscribe({
    next: created => {
      this.showAdd = false;
      this.newItem = { sku: '', name: '', category: '', unitPrice: null, quantity: null };
      this.loadList();
      this.select(created); // focus new item
    },
    error: err => {
      console.error('Create (json) failed:', err);
      this.error = err?.error?.message || err?.message || 'Failed to create item';
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
