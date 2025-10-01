import { Injectable } from '@angular/core';
import { Item } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private items: Item[] = [
    { id: 1, name: 'Thermal Label Printer', sku: 'PRN-THERM-420', vendor: 'Dymo', category: 'Equipment', stock: 7, reorderMin: 3, reorderMax: 12 },
    { id: 2, name: 'Shipping Box 12x9x4', sku: 'BOX-120904', vendor: 'Uline', category: 'Supplies', stock: 120, reorderMin: 50, reorderMax: 300 },
    { id: 3, name: 'USB-C Cable 1m', sku: 'CAB-USBC-1M', vendor: 'Anker', category: 'Cables', stock: 45, reorderMin: 20, reorderMax: 100 },
    { id: 4, name: 'Barcode Scanner', sku: 'SCAN-BC-210', vendor: 'Honeywell', category: 'Equipment', stock: 5, reorderMin: 2, reorderMax: 10 },
    { id: 5, name: 'Anti-Static Bags (M)', sku: 'ESD-BAG-M', vendor: 'SparkFun', category: 'Supplies', stock: 300, reorderMin: 100, reorderMax: 500 }
  ];

  getItems(): Item[] {
    return [...this.items];
  }
}
