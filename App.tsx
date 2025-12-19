import React, { useState } from 'react';
import { LayoutDashboard, Package, Users, Store, ScanBarcode, Settings as SettingsIcon, Bell, ShoppingCart, LogOut, Menu, AlertTriangle, ExternalLink, ChevronRight, Home, List, X, MoreHorizontal, Calendar, Clock, Plus, Barcode, DollarSign, Tag, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { isConfigured } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ResourceManager from './components/ResourceManager';
import Scanner from './components/Scanner';
import Orders from './components/Orders';
import SetupScreen from './components/SetupScreen';
import Settings from './components/Settings';
import { View, UserRole } from './types';
import { CATEGORIES_DATA } from './constants';

const MainLayout: React.FC = () => {
  const { userRole, logout, currentUser, dbError } = useAuth();
  const { notifications, sonarQueue, clearNotification } = useNotification();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  const navItems: { id: View; label: string; icon: React.ReactNode; role?: UserRole; }[] = [
    { id: View.DASHBOARD, label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: View.ORDERS, label: 'Orders', icon: <ShoppingCart size={20} /> },
    { id: View.PRODUCTS, label: 'Products', icon: <Package size={20} /> },
    { id: View.SHOPS, label: 'Shops', icon: <Store size={20} /> },
    { id: View.VENDORS, label: 'Vendors', icon: <Users size={20} />, role: UserRole.ADMIN }, 
    { id: View.SCANNER, label: 'Scanner', icon: <ScanBarcode size={20} /> },
  ];

  const bottomNavItems: { id: View; label: string; icon: React.ReactNode; role?: UserRole; }[] = [
    { id: View.SETTINGS, label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  // Mobile Nav: Compact, all sections included
  const mobileNavItems = [
    { id: View.DASHBOARD, label: 'Home', icon: <LayoutDashboard size={18} /> },
    { id: View.ORDERS, label: 'Orders', icon: <ShoppingCart size={18} /> },
    { id: View.PRODUCTS, label: 'Products', icon: <Package size={18} /> },
    { id: View.SHOPS, label: 'Shops', icon: <Store size={18} /> },
    // Only show vendors if admin, otherwise show Scanner or Settings to fill space
    ...(userRole === UserRole.ADMIN ? [{ id: View.VENDORS, label: 'Vendors', icon: <Users size={18} /> }] : [{ id: View.SCANNER, label: 'Scan', icon: <ScanBarcode size={18} /> }]),
    { id: View.SETTINGS, label: 'Config', icon: <SettingsIcon size={18} /> },
  ];

  // --- MARKET STANDARD TABLE CONFIGURATION ---
  const productFields = [
    { key: 'name', label: 'Product Name', type: 'text' as const },
    { key: 'brand', label: 'Brand', type: 'text' as const },
    { key: 'sku', label: 'SKU', type: 'text' as const },
    { key: 'barcode', label: 'Barcode', type: 'text' as const },
    { key: 'category', label: 'Category', type: 'select' as const, options: Object.keys(CATEGORIES_DATA) },
    { key: 'vendor', label: 'Supplier', type: 'text' as const },
    { key: 'price', label: 'Retail Price', type: 'number' as const },
    { key: 'costPrice', label: 'Cost Price', type: 'number' as const },
    { key: 'stock', label: 'Stock Qty', type: 'number' as const },
    { key: 'minStock', label: 'Min Level', type: 'number' as const },
    { key: 'status', label: 'Status', type: 'select' as const, options: ['Active', 'Inactive', 'Out of Stock'] },
  ];
  
  const productColumns = [
    { key: 'name', label: 'Product', format: (val: string, row: any) => 
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0 shadow-sm">
              {row.image ? <img src={row.image} alt="" className="w-full h-full object-cover rounded-xl"/> : <Package size={18}/>}
           </div>
           <div>
              <span className="font-bold text-gray-900 block text-sm">{val}</span>
              <span className="text-xs text-gray-500">{row.brand}</span>
           </div>
        </div> 
    },
    { key: 'sku', label: 'SKU / Barcode', format: (val: string, row: any) => 
       <div>
          <div className="font-mono text-xs font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded inline-block mb-1">{val || '-'}</div>
          <div className="text-[10px] text-gray-400 flex items-center gap-1"><Barcode size={10}/> {row.barcode}</div>
       </div>
    },
    { key: 'category', label: 'Category', format: (val: string) => <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{val}</span> },
    { key: 'price', label: 'Pricing', format: (val: number, row: any) => 
       <div className="text-right">
          <div className="font-bold text-gray-900">${val?.toFixed(2)}</div>
          {row.costPrice && <div className="text-[10px] text-gray-400">Cost: ${row.costPrice.toFixed(2)}</div>}
       </div>
    },
    { key: 'stock', label: 'Inventory', format: (val: number, row: any) => 
        <div className="flex items-center gap-2">
           <div className={`w-16 h-1.5 rounded-full overflow-hidden bg-gray-100`}>
              <div className={`h-full rounded-full ${val <= row.minStock ? 'bg-red-500 w-1/4' : 'bg-emerald-500 w-3/4'}`}></div>
           </div>
           <span className={`font-bold text-xs ${val <= row.minStock ? 'text-red-600' : 'text-emerald-700'}`}>{val}</span>
        </div>
    },
    { key: 'status', label: 'Status', format: (val: string) => 
        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${val === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
           {val}
        </span> 
    }
  ];

  const vendorFields = [
    { key: 'name', label: 'Vendor Name', type: 'text' as const }, 
    { key: 'owner', label: 'Contact Person', type: 'text' as const }, 
    { key: 'email', label: 'Email Address', type: 'text' as const }, 
    { key: 'phone', label: 'Phone Number', type: 'text' as const }, 
    { key: 'address', label: 'Address', type: 'text' as const },
    { key: 'status', label: 'Status', type: 'select' as const, options: ['Active', 'Inactive'] }
  ];
  
  const vendorColumns = [
    { key: 'name', label: 'Vendor', format: (val: string) => <span className="font-bold text-sm text-[#064e3b]">{val}</span> },
    { key: 'owner', label: 'Contact', format: (val: string, row: any) => 
       <div>
          <div className="text-sm font-medium text-gray-700">{val}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={10}/> {row.phone}</div>
       </div> 
    },
    { key: 'email', label: 'Email', format: (val: string) => <span className="text-sm text-blue-600 hover:underline cursor-pointer">{val}</span> },
    { key: 'productsCount', label: 'Products', format: (val: number) => <span className="font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">{val || 0}</span> },
    { key: 'status', label: 'Status', format: (val: string) => <span className={`w-2 h-2 rounded-full inline-block mr-2 ${val === 'Active' ? 'bg-emerald-500' : 'bg-red-400'}`}></span> },
  ];
  
  const shopFields = [
    {key: 'name', label: 'Shop Name', type: 'text' as const}, 
    {key: 'location', label: 'City/Location', type: 'text' as const}, 
    {key: 'address', label: 'Full Address', type: 'text' as const},
    {key: 'shopType', label: 'Shop Type', type: 'select' as const, options: ['Retail', 'Warehouse', 'Pop-up']},
    {key: 'manager', label: 'Store Manager', type: 'text' as const}
  ];
  
  const shopColumns = [
    { key: 'name', label: 'Location Name', format: (val: string, row: any) => 
       <div>
          <div className="font-bold text-sm text-gray-900">{val}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">{row.shopType}</div>
       </div> 
    },
    { key: 'location', label: 'Address', format: (val: string, row: any) => 
       <div className="text-sm text-gray-500 flex items-center gap-1">
          <MapPin size={12} className="text-emerald-500"/> {val}
       </div> 
    },
    { key: 'manager', label: 'Manager', format: (val: string) => <span className="text-sm font-medium text-gray-700">{val}</span> },
    { key: 'status', label: 'Status', format: (val: string) => <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${val === 'Open' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>{val}</span> },
  ];

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD: return <Dashboard onNavigate={setCurrentView} />;
      case View.PRODUCTS: return <ResourceManager collectionName="products" title="Products" subtitle="Manage your product catalog" fields={productFields} displayColumns={productColumns} onScan={() => setCurrentView(View.SCANNER)} />;
      case View.VENDORS: if (userRole !== UserRole.ADMIN) return <Dashboard onNavigate={setCurrentView} />; return <ResourceManager collectionName="vendors" title="Vendors" subtitle="Manage supplier relationships" fields={vendorFields} displayColumns={vendorColumns} />;
      case View.SHOPS: return <ResourceManager collectionName="shops" title="Shops" subtitle="Manage store outlets" fields={shopFields} displayColumns={shopColumns} />;
      case View.ORDERS: return <Orders userRole={userRole} />;
      case View.SCANNER: return <Scanner />;
      case View.SETTINGS: return <Settings />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f0fdf4] font-sans text-foreground overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-col fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-emerald-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        <div className="h-24 flex items-center px-8">
          <h1 className="text-2xl font-black tracking-tighter text-[#064e3b] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-[#064e3b] text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-900/20">T</div>
            TROS One
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="px-4 text-xs font-extrabold text-emerald-900/30 uppercase tracking-widest mb-4">Main Menu</p>
          {navItems.filter(i => !i.role || i.role === userRole).map((item) => (
            <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all group ${currentView === item.id ? 'bg-[#064e3b] text-white shadow-xl shadow-emerald-900/10' : 'text-gray-500 hover:bg-emerald-50 hover:text-[#064e3b]'}`}>
              <span className={`mr-3 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-emerald-300' : 'text-gray-400 group-hover:text-emerald-600'}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          
          <div className="my-8 border-t border-dashed border-emerald-100 mx-4"></div>
          <p className="px-4 text-xs font-extrabold text-emerald-900/30 uppercase tracking-widest mb-4">System</p>
          
          {bottomNavItems.map((item) => (
             <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all group ${currentView === item.id ? 'bg-[#064e3b] text-white shadow-xl' : 'text-gray-500 hover:bg-emerald-50 hover:text-[#064e3b]'}`}>
              <span className={`mr-3 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-emerald-300' : 'text-gray-400 group-hover:text-emerald-600'}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between group cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => logout()}>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold text-sm shadow-sm border border-emerald-50">{currentUser?.email?.[0].toUpperCase()}</div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-[#064e3b]">{currentUser?.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-wider">{userRole}</p>
               </div>
             </div>
             <LogOut size={18} className="text-emerald-300 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative md:ml-72 bg-[#f0fdf4]">
        
        {/* Mobile Header */}
        <header className="md:hidden px-5 py-3 bg-white/95 backdrop-blur-xl sticky top-0 z-30 flex justify-between items-center border-b border-emerald-50 shadow-sm">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-lg">T</div>
              <h1 className="text-lg font-bold text-[#064e3b] tracking-tight">
                {currentView.charAt(0) + currentView.slice(1).toLowerCase()}
              </h1>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView(View.SCANNER)} className="p-2 bg-emerald-50 rounded-xl text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"><ScanBarcode size={20} /></button>
              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold border border-gray-200">{currentUser?.email?.[0].toUpperCase()}</button>
              <LogOut  onClick={() => logout()} size={18} className="text-emerald-300 group-hover:text-red-500 transition-colors" />
           </div>
        </header>

        {/* Content Body - Added padding bottom for fixed nav */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 pb-20 md:pb-10">
          <div className="max-w-[1600px] mx-auto w-full h-full">
             {renderContent()}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation - Compact, Fixed Edge-to-Edge */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-emerald-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe">
        <div className="flex justify-between items-center h-14 px-2">
          {mobileNavItems.map((item) => (
             <button 
               key={item.id} 
               onClick={() => setCurrentView(item.id)} 
               className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all active:scale-95 min-w-[3.5rem]"
             >
               <div className={`p-1 rounded-xl transition-colors ${currentView === item.id ? 'bg-emerald-50 text-[#064e3b]' : 'text-gray-400'}`}>
                 {React.cloneElement(item.icon as React.ReactElement<any>, { 
                   size: 18, 
                   strokeWidth: currentView === item.id ? 2.5 : 2,
                   fill: currentView === item.id ? "currentColor" : "none",
                   className: currentView === item.id ? "fill-emerald-100" : ""
                 })}
               </div>
               <span className={`text-[9px] font-bold tracking-tight ${currentView === item.id ? 'text-[#064e3b]' : 'text-gray-400'}`}>
                 {item.label}
               </span>
             </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

const Root: React.FC = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#f0fdf4] text-emerald-600"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div></div>;
  if (!currentUser) return <Login />;
  return <MainLayout />;
};

const App: React.FC = () => {
  if (!isConfigured) return <SetupScreen />;
  return (
    <AuthProvider>
      <NotificationProvider>
        <Root />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;