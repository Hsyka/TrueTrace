export interface Item {
  id: number;
  name: string;
  sku: string;
  vendor: string;
  category: string;
  stock: number;
  reorderMin: number;
  reorderMax: number;
}
