import React, { useState, useEffect } from 'react';
import { User, Shield, Store, Bell, Search, Plus, Trash2, Edit, Save, Check, X, Mail, Lock, Database, FileText, AlertOctagon, RefreshCw, Users, Activity, AlertCircle, Camera, File, Upload, Menu, LogOut, CheckCircle, Smartphone, Globe, ToggleLeft, ToggleRight, Banknote, ArrowRight, CreditCard, Layout, Server, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { collection, onSnapshot, updateDoc, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNotification } from '../contexts/NotificationContext';
import { MOCK_USERS } from '../constants';
import ViewDetailsModal from './ViewDetailsModal';

const Settings: React.FC = () => {
  const { userRole, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const adminTabs = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
    { id: 'roles', label: 'Roles & Perms', icon: <Shield size={16} /> },
    { id: 'shops', label: 'Config', icon: <Store size={16} /> },
    { id: 'system', label: 'System & SMTP', icon: <Server size={16} /> },
    { id: 'logs', label: 'Logs', icon: <FileText size={16} /> },
  ];

  const vendorTabs = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'notifications', label: 'Preferences', icon: <Bell size={16} /> },
    { id: 'security', label: 'Security', icon: <Lock size={16} /> },
  ];

  const tabs = userRole === UserRole.ADMIN ? adminTabs : vendorTabs;

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col bg-white md:rounded-xl md:border md:border-mono-light md:shadow-sm overflow-hidden animate-fade-in">
      
      {/* Top Header & Tab Bar */}
      <div className="border-b border-mono-light bg-gray-50/50">
        <div className="p-4 md:p-6 pb-2">
           <h2 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h2>
           <p className="text-xs md:text-sm text-gray-500 mt-1">Manage your account and system preferences.</p>
        </div>
        
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar px-4 md:px-6">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                 activeTab === tab.id 
                   ? 'border-[#064e3b] text-[#064e3b] bg-white rounded-t-lg' 
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-t-lg'
               }`}
             >
               {tab.icon}
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-white">
         {/* Shared Tabs */}
         {activeTab === 'profile' && <ProfileTab currentUser={currentUser} userRole={userRole} />}
         {activeTab === 'notifications' && <NotificationsTab />}
         
         {/* Vendor Security */}
         {activeTab === 'security' && userRole === UserRole.VENDOR && <VendorSecurityTab />}

         {/* ADMIN ONLY TABS */}
         {userRole === UserRole.ADMIN && (
           <>
             {activeTab === 'users' && <UsersTab />}
             {activeTab === 'roles' && <RolesTab />}
             {activeTab === 'shops' && <ShopsConfigTab />}
             {activeTab === 'system' && <SystemTab />}
             {activeTab === 'logs' && <LogsTab />}
           </>
         )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ProfileTab = ({ currentUser, userRole }: any) => {
  const { triggerSonar } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    email: '',
    documents: [] as any[]
  });
  const [vendorShops, setVendorShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewShop, setViewShop] = useState<any | null>(null);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      // Fetch User Profile
      getDoc(doc(db, 'users', currentUser.uid)).then(d => {
        if (d.exists()) {
          const data = d.data() as any;
          setProfileData({
            displayName: data.displayName || currentUser.email?.split('@')[0],
            phone: data.phone || '',
            email: currentUser.email || '',
            documents: data.documents || []
          });
        }
      });

      // If Vendor, fetch assigned shops via vendor ID link
      if (userRole === UserRole.VENDOR) {
         const fetchShops = async () => {
            const vendorQ = query(collection(db, 'vendors'), where('email', '==', currentUser.email));
            const vendorSnap = await getDocs(vendorQ);
            if (!vendorSnap.empty) {
               const vendorId = vendorSnap.docs[0].id;
               const shopsQ = query(collection(db, 'shops'), where('assignedVendorId', '==', vendorId));
               const shopsSnap = await getDocs(shopsQ);
               setVendorShops(shopsSnap.docs.map(s => ({id: s.id, ...s.data() as any})));
            }
            setLoading(false);
         };
         fetchShops();
      } else {
        setLoading(false);
      }
    }
  }, [currentUser, userRole]);

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: profileData.displayName,
        phone: profileData.phone,
      });
      setIsEditing(false);
      triggerSonar('Profile updated successfully');
    } catch (e) {
      triggerSonar('Failed to update profile', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const newDoc = { name: e.target.files[0].name, date: new Date().toLocaleDateString(), url: '#' };
      setProfileData(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
      if (currentUser) {
         updateDoc(doc(db, 'users', currentUser.uid), { documents: [...profileData.documents, newDoc] });
      }
      triggerSonar('Document uploaded');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading profile...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* 1. Enhanced Business Card Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Visual Card */}
        <div className="w-full md:w-80 bg-gradient-to-br from-[#064e3b] to-emerald-800 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <User size={120} />
           </div>
           <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
                 {profileData.displayName?.[0]?.toUpperCase()}
              </div>
              <h3 className="font-bold text-xl mb-1">{profileData.displayName}</h3>
              <p className="text-emerald-100 text-sm mb-4">{profileData.email}</p>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
                 {userRole} Account
              </div>
           </div>
        </div>

        {/* Editable Form */}
        <div className="flex-1 w-full space-y-6">
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h4 className="font-bold text-gray-900 text-lg">Personal Details</h4>
                 <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors">
                   {isEditing ? 'Save Changes' : 'Edit Profile'}
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Display Name</label>
                    <input type="text" disabled={!isEditing} value={profileData.displayName} onChange={e => setProfileData({...profileData, displayName: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] disabled:opacity-70 disabled:cursor-not-allowed transition-all" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Phone</label>
                    <input type="text" disabled={!isEditing} value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] disabled:opacity-70 disabled:cursor-not-allowed transition-all" />
                 </div>
                 <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                       <Mail size={16} className="absolute left-3 top-3 text-gray-400"/>
                       <input type="text" disabled value={profileData.email} className="w-full pl-10 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Stylized Bank Card for Vendors */}
           {userRole === UserRole.VENDOR && (
             <div className="bg-gray-900 rounded-xl p-6 shadow-lg relative overflow-hidden text-white border border-gray-700">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                   <Banknote size={150} />
                </div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <div>
                      <h4 className="font-bold text-lg flex items-center gap-2"><CreditCard size={20}/> Payment Information</h4>
                      <p className="text-gray-400 text-xs mt-1">For Order Remittances</p>
                   </div>
                   <div className="text-right">
                      <span className="block font-bold text-[#064e3b]">TROS BANK</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Corporate</span>
                   </div>
                </div>
                <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-end border-b border-gray-700 pb-2">
                      <span className="text-xs text-gray-400 uppercase">Account Holder</span>
                      <span className="font-mono font-medium tracking-wide">TROS One Holdings Ltd.</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-700 pb-2">
                      <span className="text-xs text-gray-400 uppercase">Account Number</span>
                      <span className="font-mono font-bold text-xl tracking-widest text-[#064e3b]">8829 3910 2039</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <div className="flex gap-8">
                         <div>
                            <span className="text-[10px] text-gray-500 block">SORT CODE</span>
                            <span className="font-mono">20-40-60</span>
                         </div>
                         <div>
                            <span className="text-[10px] text-gray-500 block">IBAN</span>
                            <span className="font-mono">GB29 3910</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] text-gray-500 block">REF ID</span>
                         <span className="font-mono text-xs">{currentUser?.uid?.slice(0,8).toUpperCase()}</span>
                      </div>
                   </div>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assigned Shops */}
              {userRole === UserRole.VENDOR && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                   <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Store size={18} className="text-[#064e3b]"/> My Shops</h4>
                   {vendorShops.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                         <p className="text-sm text-gray-500">No shops assigned yet.</p>
                      </div>
                   ) : (
                      <div className="space-y-3">
                         {vendorShops.map(shop => (
                           <div key={shop.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-emerald-200 transition-colors group cursor-pointer" onClick={() => setViewShop(shop)}>
                              <div>
                                 <p className="font-bold text-sm text-gray-900">{shop.name}</p>
                                 <p className="text-xs text-gray-500 flex items-center gap-1"><Smartphone size={10}/> {shop.location}</p>
                              </div>
                              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#064e3b] transition-colors"/>
                           </div>
                         ))}
                      </div>
                   )}
                </div>
              )}

              {/* Document Management */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2"><File size={18} className="text-blue-500"/> Documents</h4>
                    <label className="cursor-pointer text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors">
                       <Upload size={12} /> Upload
                       <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                 </div>
                 {profileData.documents.length === 0 ? (
                   <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400">No documents uploaded.</p>
                   </div>
                 ) : (
                   <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {profileData.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><FileText size={14}/></div>
                              <div className="min-w-0">
                                 <p className="text-xs font-bold text-gray-800 truncate">{doc.name}</p>
                                 <p className="text-[10px] text-gray-500">{doc.date}</p>
                              </div>
                           </div>
                           <button className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
      
      {/* Detail Modal for Shops */}
      {viewShop && (
        <ViewDetailsModal 
          isOpen={!!viewShop} 
          onClose={() => setViewShop(null)} 
          data={viewShop} 
          type="shop" 
        />
      )}
    </div>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const { triggerSonar } = useNotification();

  useEffect(() => {
    // Fetch users from firestore
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({id: d.id, ...d.data() as any})));
    }).catch(() => setUsers(MOCK_USERS)); // Fallback
  }, []);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">User Management</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"><Plus size={16}/> Add User</button>
       </div>
       <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                   <th className="p-4">User</th>
                   <th className="p-4">Role</th>
                   <th className="p-4">Joined</th>
                   <th className="p-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{u.email?.[0]?.toUpperCase()}</div>
                           <div className="text-sm font-medium text-gray-900">{u.email}</div>
                        </div>
                     </td>
                     <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Administrator' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                     <td className="p-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                     <td className="p-4 text-right">
                        <button className="text-gray-400 hover:text-red-600 p-1" onClick={() => triggerSonar('Action restricted in demo', 'info')}><Trash2 size={16}/></button>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

const RolesTab = () => {
  const [permissions, setPermissions] = useState<any>({
    Administrator: ['view_dashboard', 'manage_orders', 'manage_users', 'manage_system'],
    Vendor: ['view_dashboard', 'manage_orders']
  });

  const togglePermission = (role: string, perm: string) => {
    const current = permissions[role];
    if (current.includes(perm)) {
      setPermissions({...permissions, [role]: current.filter((p:string) => p !== perm)});
    } else {
      setPermissions({...permissions, [role]: [...current, perm]});
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {['Administrator', 'Vendor'].map(role => (
         <div key={role} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-3 mb-6">
               <div className={`p-3 rounded-lg ${role === 'Administrator' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Shield size={24} />
               </div>
               <div>
                 <h3 className="font-bold text-lg text-gray-900">{role}</h3>
                 <p className="text-sm text-gray-500">Role Permissions</p>
               </div>
            </div>
            
            <div className="space-y-3">
               {[
                 { id: 'view_dashboard', label: 'View Dashboard' },
                 { id: 'manage_orders', label: 'Manage Orders' },
                 { id: 'manage_users', label: 'Manage Users & Roles' },
                 { id: 'manage_system', label: 'System Configuration' },
                 { id: 'delete_records', label: 'Delete Records' }
               ].map(perm => {
                 const isActive = permissions[role]?.includes(perm.id);
                 return (
                   <div key={perm.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => togglePermission(role, perm.id)}>
                      <span className={`text-sm ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{perm.label}</span>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${isActive ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                         {isActive && <Check size={12} className="text-white"/>}
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>
       ))}
    </div>
  );
};

const ShopsConfigTab = () => (
  <div className="max-w-2xl space-y-6">
     <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Global Shop Settings</h3>
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50"><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option></select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50"><option>UTC</option><option>EST</option><option>PST</option></select>
           </div>
           <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-gray-700">Auto-Approve Orders</span>
              <button className="text-[#064e3b]"><ToggleRight size={32}/></button>
           </div>
        </div>
     </div>
  </div>
);

const SystemTab = () => {
  const { triggerSonar } = useNotification();
  const [smtpConfig, setSmtpConfig] = useState({
    host: '', port: '587', user: '', pass: '', fromEmail: ''
  });

  const handleSaveSmtp = () => {
    // In a real app, this would save to a secured Firestore collection or Cloud Secret Manager
    // For this frontend demo, we simulate saving.
    console.log("Saving SMTP Config:", smtpConfig);
    triggerSonar("SMTP Configuration Saved");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Database size={18}/> Database Status</h3>
          <div className="space-y-3">
             <div className="flex justify-between text-sm"><span className="text-gray-600">Connection</span> <span className="text-green-600 font-bold">Active</span></div>
             <div className="flex justify-between text-sm"><span className="text-gray-600">Provider</span> <span className="font-medium">Firebase Firestore</span></div>
             <div className="flex justify-between text-sm"><span className="text-gray-600">Last Backup</span> <span className="font-medium">2 hours ago</span></div>
          </div>
          <button className="w-full mt-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200">Trigger Backup</button>
       </div>

       {/* SMTP Configuration Section */}
       <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Mail size={18}/> SMTP Configuration</h3>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Host</label>
                   <input type="text" placeholder="smtp.gmail.com" value={smtpConfig.host} onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm mt-1" />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Port</label>
                   <input type="text" placeholder="587" value={smtpConfig.port} onChange={e => setSmtpConfig({...smtpConfig, port: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm mt-1" />
                </div>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Username / Email</label>
                <input type="text" placeholder="notifications@tros.one" value={smtpConfig.user} onChange={e => setSmtpConfig({...smtpConfig, user: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm mt-1" />
             </div>
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Password / App Key</label>
                <input type="password" placeholder="••••••••" value={smtpConfig.pass} onChange={e => setSmtpConfig({...smtpConfig, pass: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm mt-1" />
             </div>
             <button onClick={handleSaveSmtp} className="w-full mt-2 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-bold hover:bg-[#065f46] flex items-center justify-center gap-2">
                <Save size={14}/> Save SMTP Settings
             </button>
          </div>
       </div>
    </div>
  );
};

const LogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    getDocs(collection(db, 'logs')).then(snap => setLogs(snap.docs.map(d => d.data())));
  }, []);
  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs h-96 overflow-y-auto shadow-inner custom-scrollbar">
       {logs.length === 0 && <p className="opacity-50">No system logs found.</p>}
       {logs.map((log, i) => (
         <div key={i} className="mb-1 border-b border-gray-800 pb-1">
            <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span> <span className="text-yellow-400">{log.type}</span>: {log.description} <span className="opacity-50">by {log.user}</span>
         </div>
       ))}
    </div>
  );
};

const VendorSecurityTab = () => <div className="text-center text-gray-500 p-10">Security settings restricted. Contact Admin to reset password.</div>;
const NotificationsTab = () => (
  <div className="max-w-2xl space-y-6">
     <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-base">UI Preferences</h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
           <span className="text-sm font-medium flex items-center gap-2"><Layout size={16}/> Compact Mode</span>
           <ToggleLeft size={32} className="text-gray-300 cursor-pointer"/>
        </div>
     </div>

     <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-base">Notification Alerts</h3>
        <div className="space-y-3">
           {['Order Status Updates', 'Low Stock Warnings', 'System Maintenance', 'Email Summaries'].map(n => (
             <div key={n} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">{n}</span>
                <ToggleRight size={32} className="text-green-500 cursor-pointer hover:text-green-600"/>
             </div>
           ))}
        </div>
     </div>
  </div>
);

export default Settings;