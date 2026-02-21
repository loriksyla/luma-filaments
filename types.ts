export enum FilamentType {
  PLA = 'PLA',
  PETG = 'PETG',
  ABS = 'ABS',
  TPU = 'TPU',
  ASA = 'ASA'
}

export interface Product {
  id: string;
  name: string;
  type: FilamentType;
  price: number;
  weight: string; // e.g. "1kg"
  imageUrl: string;
  available: boolean;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}


export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  customCity?: string;
  address: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}


export interface User {
  email: string;
  name: string;
  addresses: Address[];
  isAdmin: boolean;
}

export type OrderStatus = 'Krijuar' | 'Në proces' | 'Në dërgim' | 'Dorëzuar' | 'Anuluar';

export interface Order {
  id: string;
  userId: string; // or 'guest'
  customerName: string;
  customerEmail: string;
  total: number;
  date: string;
  status: OrderStatus;
  items: CartItem[];
  address: Address | string; // Simple string if guest, Address object if user
}