
export enum UserRole {
  ADMIN = 'Administrator',
  VENDOR = 'Vendor'
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  VENDORS = 'VENDORS',
  SHOPS = 'SHOPS',
  ORDERS = 'ORDERS',
  SCANNER = 'SCANNER',
  SETTINGS = 'SETTINGS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  MORE = 'MORE'
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  taxRate: number;
  stock: number;
  minStock: number;
  category: string;
  subCategory?: string;
  status: 'Active' | 'Inactive' | 'Out of Stock';
  vendor: string;
  shopId?: string; 
  shopName?: string; 
  manufacturer: string;
  origin: string;
  expiryDate: string;
  image?: string;
  packSize?: string;
  weight?: string;
  dimensions?: string; 
  supplierSku?: string; 
  description?: string;
  taxCategory?: string; 
  lastUpdated?: string; // New
}

export interface Vendor {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  productsCount: number;
  shopsCount?: number; // New
  createdDate?: string; // New
  lastLogin?: string; // New
  taxId?: string; 
  paymentTerms?: string; 
  licenseNumber?: string; 
  website?: string; 
  address?: string; 
  documents?: { name: string; url: string; date: string }[];
  customFields?: Record<string, string>;
  linkedUserId?: string; 
  _assignments?: Shop[]; 
}

export interface Shop {
  id: string;
  name: string;
  manager: string;
  location: string;
  address: string;
  phone: string;
  status: 'Open' | 'Closed';
  assignedVendorId?: string; 
  assignedVendorName?: string; 
  operatingHours?: string; 
  squareFootage?: number; 
  shopType?: string; 
  productsCount?: number; // New
  stockValue?: number; // New
  lastSync?: string; // New
  documents?: { name: string; url: string; date: string }[];
  customFields?: Record<string, string>;
  _assignments?: Vendor[]; 
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  vendorName: string;
  date: string;
  totalItems: number;
  totalValue: number;
  status: 'Pending' | 'In Progress' | 'Hold' | 'Completed';
  shop: string;
  shopId?: string; 
  items?: OrderItem[]; 
}

export interface ChangeRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  targetCollection: string;
  targetId: string;
  targetName: string;
  requestType: 'UPDATE_INFO' | 'STOCK_ADJUSTMENT' | 'OTHER';
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface StatCard {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export interface Activity {
  id: string;
  type: 'ORDER' | 'PRODUCT' | 'VENDOR' | 'SYSTEM';
  description: string;
  user: string;
  timestamp: string;
}

export interface Assignment {
  id: string;
  vendorId: string;
  shopId: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  documents?: { name: string; url: string; date: string }[];
}