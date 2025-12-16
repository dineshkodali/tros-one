import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { TrendingUp, Users, Package, ShoppingCart, AlertTriangle, ArrowRight, Store, Calendar, CreditCard, ScanBarcode, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, View } from '../types';

interface DashboardProps {
  onNavigate?: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { userRole, currentUser } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    shops: 0,
    lowStock: 0,
    revenue: 0,
    activeVendors: 0
  });

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // 1. Products & Stock
    let prodQuery = query(collection(db, 'products'));
    if (userRole === UserRole.VENDOR && currentUser?.email) {
       prodQuery = query(collection(db, 'products'), where('vendor', '==', currentUser.email));
    }
    unsubscribes.push(onSnapshot(prodQuery, (snap: QuerySnapshot<DocumentData>) => {
       const lowStock = snap.docs.filter(d => (d.data().stock || 0) <= (d.data().minStock || 10)).length;
       setStats(prev => ({ ...prev, products: snap.size, lowStock }));
    }));

    // 2. Orders & Revenue
    let orderQuery = query(collection(db, 'orders'));
    // Filter logic for vendor would be here
    unsubscribes.push(onSnapshot(orderQuery, (snap: QuerySnapshot<DocumentData>) => {
       const orders = snap.docs.map(d => d.data());
       const totalRev = orders.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
       setStats(prev => ({ ...prev, orders: snap.size, revenue: totalRev }));
    }));

    // 3. Vendors/Shops (Admin Stats)
    if (userRole === UserRole.ADMIN) {
        unsubscribes.push(onSnapshot(collection(db, 'vendors'), (snap: QuerySnapshot<DocumentData>) => {
            setStats(prev => ({ ...prev, activeVendors: snap.size }));
        }));
        unsubscribes.push(onSnapshot(collection(db, 'shops'), (snap: QuerySnapshot<DocumentData>) => {
            setStats(prev => ({ ...prev, shops: snap.size }));
        }));
    }

    return () => unsubscribes.forEach(u => u());
  }, [userRole, currentUser]);

  const StatCard = ({ title, value, icon: Icon, color, subtext, target }: any) => (
    <div 
      onClick={() => onNavigate && target && onNavigate(target)}
      className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 flex items-start justify-between hover:shadow-lg hover:border-emerald-300 hover:-translate-y-1 transition-all cursor-pointer group"
    >
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-emerald-600 transition-colors">{title}</p>
        <h3 className="text-3xl font-bold text-[#064e3b]">{value}</h3>
        {subtext && <p className="text-xs text-emerald-600 mt-2 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  const FunctionCard = ({ title, desc, icon: Icon, onClick }: any) => (
    <div onClick={onClick} className="group cursor-pointer bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 hover:border-[#064e3b] hover:shadow-lg transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <div className="relative z-10">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-[#064e3b] mb-4 group-hover:bg-[#064e3b] group-hover:text-white transition-colors">
          <Icon size={24} />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#064e3b]">{title}</h4>
        <p className="text-sm text-gray-500 mb-4">{desc}</p>
        <div className="flex items-center text-sm font-bold text-[#064e3b] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
          Access Module <ArrowRight size={16} className="ml-2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-10 px-2 md:px-0">
      
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#064e3b]">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your business performance</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-[#064e3b]">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* 1. Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${(stats.revenue/1000).toFixed(1)}k`} 
          icon={CreditCard} 
          color="bg-[#064e3b]" 
          subtext="+12% from last month"
          target={View.ORDERS}
        />
        <StatCard 
          title="Active Orders" 
          value={stats.orders} 
          icon={ShoppingCart} 
          color="bg-emerald-600" 
          subtext="Pending processing"
          target={View.ORDERS}
        />
        <StatCard 
          title="Inventory Items" 
          value={stats.products} 
          icon={Package} 
          color="bg-emerald-500" 
          subtext={`${stats.lowStock} Low Stock Alerts`}
          target={View.PRODUCTS}
        />
        <StatCard 
          title={userRole === UserRole.ADMIN ? "Total Vendors" : "My Shops"} 
          value={userRole === UserRole.ADMIN ? stats.activeVendors : stats.shops} 
          icon={userRole === UserRole.ADMIN ? Users : Store} 
          color="bg-emerald-400" 
          subtext="Active & Verified"
          target={userRole === UserRole.ADMIN ? View.VENDORS : View.SHOPS}
        />
      </div>

      {/* 2. Quick Functions / Redirections */}
      <div>
        <h3 className="text-lg font-bold text-[#064e3b] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FunctionCard 
            title="Manage Orders" 
            desc="View pending orders, approve requests, and track shipments." 
            icon={ShoppingCart}
            onClick={() => onNavigate && onNavigate(View.ORDERS)} 
          />
          <FunctionCard 
            title="Inventory Control" 
            desc="Update stock levels, add products, and manage categories." 
            icon={Package}
            onClick={() => onNavigate && onNavigate(View.PRODUCTS)} 
          />
          <FunctionCard 
            title="Barcode Scanner" 
            desc="Quickly scan items for stock checks or sales." 
            icon={ScanBarcode}
            onClick={() => onNavigate && onNavigate(View.SCANNER)} 
          />
          {userRole === UserRole.ADMIN && (
            <FunctionCard 
              title="Vendor Management" 
              desc="Onboard new vendors and manage partnerships." 
              icon={Users}
              onClick={() => onNavigate && onNavigate(View.VENDORS)} 
            />
          )}
          {userRole === UserRole.ADMIN && (
            <FunctionCard 
              title="Shop Configurations" 
              desc="Manage store locations and assignments." 
              icon={Store}
              onClick={() => onNavigate && onNavigate(View.SHOPS)} 
            />
          )}
          <FunctionCard 
            title="Reports & Analytics" 
            desc="View detailed sales reports and growth trends." 
            icon={TrendingUp}
            onClick={() => {}} 
          />
        </div>
      </div>

      {/* 3. Recent Alerts / Status (Simple List) */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-[#064e3b]">System Alerts</h3>
          <button className="text-sm text-emerald-600 font-bold hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {stats.lowStock > 0 && (
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => onNavigate && onNavigate(View.PRODUCTS)}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-red-900">Low Stock Warning</h4>
                  <p className="text-sm text-red-700">{stats.lowStock} items are below safety levels.</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-red-400" />
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
             <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-100 text-[#064e3b] rounded-lg">
                   <Calendar size={20} />
                </div>
                <div>
                   <h4 className="font-bold text-[#064e3b]">System Operational</h4>
                   <p className="text-sm text-emerald-700">All services are running smoothly.</p>
                </div>
             </div>
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;