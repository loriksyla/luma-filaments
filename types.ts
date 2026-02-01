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
  color: string;
  hex: string;
  price: number;
  weight: string; // e.g. "1kg"
  description: string;
  imageUrl: string;
  available: boolean;
  brand?: string; // Added for custom text on spool
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdvisorRequest {
  printerModel: string;
  filamentType: string;
  application: string;
}

export interface PrintSettings {
  nozzleTemp: string;
  bedTemp: string;
  speed: string;
  fanSpeed: string;
  retraction: string;
  expertTip: string;
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

export type Role = 'user' | 'admin';

export interface User {
    email: string;
    name: string;
    addresses: Address[];
    role: Role;
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