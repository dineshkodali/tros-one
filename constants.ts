
import { Product, Vendor, Shop, Order, Activity } from './types';

export const CATEGORIES_DATA: Record<string, string[]> = {
  "EXOTIC PRODUCTS": [],
  "FOODS": [
    "Bread & Cakes",
    "Buy Candy",
    "Fresh Foods",
    "Frozen Foods",
    "Snacks",
    "Noodles",
    "Cookies & Cakes",
    "Confectionery"
  ],
  "BEVERAGES": [
    "FRUITS JUICES",
    "SOFT DRINKS",
    "ENERGY DRINKS",
    "WATER"
  ],
  "GROCERY & NON FOODS": [
    "NON FOODS",
    "GROCERY",
    "CLEANING",
    "HOUSEHOLD"
  ],
  "ALCOHOL": [
    "BEER",
    "BEER/LAGER/ALE LOW/NO ALCOHOL",
    "LAGER",
    "RED WINE",
    "ROSE WINE",
    "RTD ALCOHOLS",
    "SPIRITS & FORTIFIED WINES",
    "WHITE WINE"
  ],
  "WORLD FOOD": [
    "ASIAN",
    "MEXICAN",
    "ITALIAN"
  ]
};

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: '1', name: 'Premium Orange Juice', brand: 'Tropicana', sku: 'OJ-001', barcode: '123456789', 
    price: 4.99, costPrice: 2.50, taxRate: 5, stock: 120, minStock: 20, category: 'BEVERAGES', subCategory: 'FRUITS JUICES',
    status: 'Active', vendor: 'BevCo Ltd', manufacturer: 'PepsiCo', origin: 'USA', expiryDate: '2024-12-01'
  },
  { 
    id: '2', name: 'Organic Almonds', brand: 'NuttyLife', sku: 'NUT-044', barcode: '987654321', 
    price: 12.50, costPrice: 8.00, taxRate: 0, stock: 45, minStock: 50, category: 'FOODS', subCategory: 'Snacks',
    status: 'Active', vendor: 'HealthFirst', manufacturer: 'NuttyLife Inc', origin: 'Spain', expiryDate: '2025-06-15'
  },
  { 
    id: '3', name: 'Wireless Mouse', brand: 'Logitech', sku: 'TEC-202', barcode: '456123789', 
    price: 29.99, costPrice: 15.00, taxRate: 10, stock: 8, minStock: 10, category: 'GROCERY & NON FOODS', subCategory: 'NON FOODS',
    status: 'Out of Stock', vendor: 'Techies', manufacturer: 'Logitech', origin: 'China', expiryDate: 'N/A'
  },
  { 
    id: '4', name: 'Yoga Mat', brand: 'Lululemon', sku: 'FIT-101', barcode: '789123456', 
    price: 55.00, costPrice: 30.00, taxRate: 8, stock: 200, minStock: 15, category: 'GROCERY & NON FOODS', subCategory: 'NON FOODS',
    status: 'Active', vendor: 'SportsWorld', manufacturer: 'Lululemon', origin: 'Vietnam', expiryDate: 'N/A'
  },
  { 
    id: '5', name: 'Cabernet Sauvignon', brand: 'WineryX', sku: 'WIN-555', barcode: '321654987', 
    price: 18.75, costPrice: 9.50, taxRate: 12, stock: 12, minStock: 5, category: 'ALCOHOL', subCategory: 'RED WINE',
    status: 'Inactive', vendor: 'HomeGoods', manufacturer: 'WineryX Ltd', origin: 'Portugal', expiryDate: 'N/A'
  },
  {
    id: '6', name: 'Sourdough Bread', brand: 'BakeryFresh', sku: 'BRD-101', barcode: '112233445', 
    price: 3.50, costPrice: 1.20, taxRate: 0, stock: 15, minStock: 10, category: 'FOODS', subCategory: 'Bread & Cakes',
    status: 'Active', vendor: 'FreshBakes', manufacturer: 'Local Bakery', origin: 'UK', expiryDate: '2023-11-05'
  },
  {
    id: '7', name: 'Sparkling Water 6pk', brand: 'Perrier', sku: 'WAT-303', barcode: '556677889', 
    price: 8.99, costPrice: 4.50, taxRate: 5, stock: 60, minStock: 20, category: 'BEVERAGES', subCategory: 'WATER',
    status: 'Active', vendor: 'BevCo Ltd', manufacturer: 'Nestle', origin: 'France', expiryDate: '2024-08-01'
  },
  {
    id: '8', name: 'Cheddar Cheese Block', brand: 'DairyBest', sku: 'CHE-221', barcode: '998877665', 
    price: 6.50, costPrice: 3.50, taxRate: 0, stock: 8, minStock: 15, category: 'FOODS', subCategory: 'Fresh Foods',
    status: 'Active', vendor: 'HealthFirst', manufacturer: 'DairyBest Co', origin: 'USA', expiryDate: '2023-12-12'
  },
  {
    id: '9', name: 'AA Batteries 12pk', brand: 'Duracell', sku: 'BAT-900', barcode: '443322110', 
    price: 14.99, costPrice: 8.00, taxRate: 10, stock: 200, minStock: 30, category: 'GROCERY & NON FOODS', subCategory: 'HOUSEHOLD',
    status: 'Active', vendor: 'Techies', manufacturer: 'Duracell', origin: 'China', expiryDate: '2028-01-01'
  },
  {
    id: '10', name: 'Corona Extra 12pk', brand: 'Corona', sku: 'BEE-404', barcode: '667788990', 
    price: 19.99, costPrice: 12.00, taxRate: 15, stock: 40, minStock: 10, category: 'ALCOHOL', subCategory: 'LAGER',
    status: 'Active', vendor: 'BevCo Ltd', manufacturer: 'Grupo Modelo', origin: 'Mexico', expiryDate: '2024-05-01'
  }
];

export const MOCK_VENDORS: Vendor[] = [
  { id: '1', name: 'BevCo Ltd', owner: 'John Doe', email: 'john@bevco.com', phone: '+1 234 567 890', status: 'Active', productsCount: 150 },
  { id: '2', name: 'HealthFirst', owner: 'Jane Smith', email: 'jane@health.com', phone: '+1 987 654 321', status: 'Active', productsCount: 89 },
  { id: '3', name: 'Techies', owner: 'Mike Ross', email: 'mike@techies.com', phone: '+1 555 123 456', status: 'Inactive', productsCount: 42 },
  { id: '4', name: 'FreshBakes', owner: 'Sarah Lee', email: 'sarah@freshbakes.com', phone: '+44 20 7946 0958', status: 'Active', productsCount: 25 },
  { id: '5', name: 'SportsWorld', owner: 'David Beckham', email: 'david@sportsworld.com', phone: '+1 310 555 0199', status: 'Active', productsCount: 210 },
  { id: '6', name: 'HomeGoods', owner: 'Martha Stewart', email: 'martha@homegoods.com', phone: '+1 212 555 0188', status: 'Active', productsCount: 134 },
  { id: '7', name: 'GlobalImports', owner: 'Carlos Slim', email: 'carlos@global.com', phone: '+52 55 1234 5678', status: 'Active', productsCount: 300 },
];

export const MOCK_SHOPS: Shop[] = [
  { id: '1', name: 'Downtown Branch', manager: 'Alice Wonderland', location: 'New York, NY', address: '123 Broadway St', phone: '+1 212-555-1234', status: 'Open' },
  { id: '2', name: 'Westside Outlet', manager: 'Bob Builder', location: 'Los Angeles, CA', address: '456 Sunset Blvd', phone: '+1 310-555-5678', status: 'Open' },
  { id: '3', name: 'North Point Kiosk', manager: 'Charlie Brown', location: 'Chicago, IL', address: '789 Michigan Ave', phone: '+1 312-555-9012', status: 'Closed' },
  { id: '4', name: 'Airport Express', manager: 'Diana Prince', location: 'JFK Terminal 4', address: 'JFK Int Airport', phone: '+1 718-555-3456', status: 'Open' },
  { id: '5', name: 'Suburban Mall', manager: 'Evan Peters', location: 'Austin, TX', address: '101 Congress Ave', phone: '+1 512-555-7890', status: 'Open' },
  { id: '6', name: 'Seaside Pop-up', manager: 'Fiona Gallagher', location: 'Miami, FL', address: '202 Ocean Dr', phone: '+1 305-555-2345', status: 'Closed' },
];

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', vendorName: 'BevCo Ltd', date: '2023-10-25', totalItems: 50, totalValue: 250.00, status: 'Pending', shop: 'Downtown Branch' },
  { id: 'ORD-002', vendorName: 'HealthFirst', date: '2023-10-24', totalItems: 20, totalValue: 180.50, status: 'Completed', shop: 'Westside Outlet' },
  { id: 'ORD-003', vendorName: 'Techies', date: '2023-10-23', totalItems: 5, totalValue: 150.00, status: 'In Progress', shop: 'Downtown Branch' },
  { id: 'ORD-004', vendorName: 'BevCo Ltd', date: '2023-10-22', totalItems: 12, totalValue: 60.00, status: 'Hold', shop: 'North Point Kiosk' },
  { id: 'ORD-005', vendorName: 'FreshBakes', date: '2023-10-21', totalItems: 30, totalValue: 105.00, status: 'Completed', shop: 'Suburban Mall' },
  { id: 'ORD-006', vendorName: 'SportsWorld', date: '2023-10-20', totalItems: 8, totalValue: 420.00, status: 'Pending', shop: 'Westside Outlet' },
];

export const MOCK_USERS = [
  { id: '1', email: 'dineshkodali.uk@gmail.com', role: 'Administrator', createdAt: '2023-01-01T10:00:00Z' },
  { id: '2', email: 'vendor@tros.one', role: 'Vendor', createdAt: '2023-01-02T11:30:00Z' },
  { id: '3', email: 'john@bevco.com', role: 'Vendor', createdAt: '2023-01-05T09:15:00Z' },
  { id: '4', email: 'alice@shop.com', role: 'Vendor', createdAt: '2023-02-10T14:20:00Z' },
  { id: '5', email: 'support@tros.one', role: 'Administrator', createdAt: '2023-03-15T16:45:00Z' },
];

export const DASHBOARD_STATS = [
  { title: 'Total Products', value: '5,678', trend: '+12% vs last month', trendUp: true, icon: 'Users' },
  { title: 'Low Stock Items', value: '23', trend: '+2 vs last month', trendUp: false, icon: 'Briefcase' },
  { title: 'Out of Stock', value: '5', trend: '-2% vs last month', trendUp: true, icon: 'Calendar' },
  { title: 'Pending Orders', value: '14', trend: 'Needs Approval', trendUp: false, icon: 'Clipboard' },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', type: 'ORDER', description: 'New order #ORD-005 received from Downtown Branch', user: 'Alice Wonderland', timestamp: '10 mins ago' },
  { id: '2', type: 'PRODUCT', description: 'Stock updated for "Premium Orange Juice" (+50 units)', user: 'John Doe', timestamp: '1 hour ago' },
  { id: '3', type: 'SYSTEM', description: 'Weekly backup completed successfully', user: 'System', timestamp: '2 hours ago' },
  { id: '4', type: 'VENDOR', description: 'New vendor "Organic Farms" registration approved', user: 'Admin', timestamp: '5 hours ago' },
  { id: '5', type: 'PRODUCT', description: 'Low stock alert: Wireless Mouse (8 units left)', user: 'System', timestamp: '1 day ago' },
];
