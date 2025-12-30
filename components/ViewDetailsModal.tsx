import React, { useState } from 'react';
import { X, MapPin, Phone, Mail, Package, Layers, Clock, User, Store, Plus, ArrowRight, ShieldCheck, Globe, CreditCard, Tag, Scale } from 'lucide-react';
import { Product, Vendor, Shop } from '../types';
import AssignDialog from './AssignDialog';

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'product' | 'vendor' | 'shop';
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ isOpen, onClose, data, type }) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  if (!isOpen || !data) return null;

  const renderProductDetails = (product: Product) => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Product Info */}
        <div className="w-full md:w-1/3 space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-inner">
             <Package size={64} className="text-emerald-200" />
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
             <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Current Stock</div>
             <div className="text-2xl font-bold text-[#064e3b] leading-none mb-1">{product.stock}</div>
             <div className="text-xs text-emerald-400 font-medium">Min Level: {product.minStock}</div>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="flex-1 space-y-5">
           <div>
             <div className="flex justify-between items-start">
                <div>
                   <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
                   <p className="text-sm text-gray-500 font-medium mt-1">{product.brand} • {product.category}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${product.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                   {product.status}
                </span>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                 <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Retail Price</span>
                 <span className="font-bold text-gray-900 text-lg">${product.price?.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                 <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Cost Price</span>
                 <span className="font-bold text-gray-700 text-lg">${product.costPrice?.toFixed(2) || '0.00'}</span>
              </div>
           </div>

           <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Layers size={14} className="text-[#064e3b]"/> Specs</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                 <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="text-gray-500">SKU</span>
                    <span className="font-mono font-medium text-gray-800">{product.sku}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="text-gray-500">Barcode</span>
                    <span className="font-mono font-medium text-gray-800">{product.barcode}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="text-gray-500">Origin</span>
                    <span className="font-medium text-gray-800">{product.origin}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="text-gray-500">Expiry</span>
                    <span className="font-medium text-gray-800">{product.expiryDate}</span>
                 </div>
                 {product.weight && (
                    <div className="flex justify-between border-b border-gray-200 py-1">
                       <span className="text-gray-500">Weight</span>
                       <span className="font-medium text-gray-800">{product.weight}</span>
                    </div>
                 )}
              </div>
           </div>

           {product.description && (
             <div className="text-xs text-gray-600 leading-relaxed bg-white p-3 border border-gray-100 rounded-lg">
                <span className="font-bold block text-gray-800 mb-1">Description</span>
                {product.description}
             </div>
           )}
        </div>
      </div>
    </div>
  );

  const renderVendorDetails = (vendor: Vendor) => (
    <div className="space-y-6">
       <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
             {vendor.name[0]}
          </div>
          <div className="flex-1">
             <h2 className="text-xl font-bold text-gray-900">{vendor.name}</h2>
             <div className="flex items-center gap-3 mt-1 text-xs">
                <span className={`px-2 py-0.5 rounded font-bold ${vendor.status==='Active'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{vendor.status}</span>
                <span className="text-gray-400">ID: {vendor.id.slice(0,8)}</span>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
             <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2"><User size={14}/> Contact Info</h3>
             <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3 text-gray-700">
                   <div className="w-6 flex justify-center"><User size={14} className="text-blue-500"/></div> 
                   <span className="font-medium">{vendor.owner}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                   <div className="w-6 flex justify-center"><Mail size={14} className="text-blue-500"/></div>
                   <span className="truncate">{vendor.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                   <div className="w-6 flex justify-center"><Phone size={14} className="text-blue-500"/></div>
                   <span>{vendor.phone}</span>
                </div>
                {vendor.address && (
                   <div className="flex items-start gap-3 text-gray-700">
                      <div className="w-6 flex justify-center mt-0.5"><MapPin size={14} className="text-blue-500"/></div>
                      <span className="text-xs">{vendor.address}</span>
                   </div>
                )}
             </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
             <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2"><ShieldCheck size={14}/> Business Details</h3>
             <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200">
                   <span className="text-gray-500">Tax ID</span>
                   <span className="font-mono font-medium">{vendor.taxId || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                   <span className="text-gray-500">License No</span>
                   <span className="font-mono font-medium">{vendor.licenseNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                   <span className="text-gray-500">Total Products</span>
                   <span className="font-bold">{vendor.productsCount}</span>
                </div>
                {vendor.website && (
                   <div className="pt-1">
                      <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                         <Globe size={12}/> Visit Website
                      </a>
                   </div>
                )}
             </div>
          </div>
       </div>

       <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2"><Store size={16} className="text-[#064e3b]"/> Assigned Shops</h3>
             <button onClick={() => setIsAssignDialogOpen(true)} className="text-xs bg-white border border-[#064e3b] text-[#064e3b] px-3 py-1 rounded-full font-bold hover:bg-[#064e3b] hover:text-white transition-all flex items-center gap-1">
                <Plus size={12} /> Manage
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
             {vendor._assignments && vendor._assignments.length > 0 ? (
               vendor._assignments.map((s: any) => (
                 <div key={s.id} className="text-xs p-3 border border-gray-200 rounded-lg flex justify-between items-center bg-white hover:border-emerald-200 transition-colors">
                    <div>
                       <span className="font-bold block text-gray-800">{s.name}</span>
                       <span className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin size={10}/> {s.location}</span>
                    </div>
                    <ArrowRight size={14} className="text-gray-300"/>
                 </div>
               ))
             ) : (
               <div className="col-span-2 text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 italic">No shops assigned yet.</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );

  const renderShopDetails = (shop: Shop) => (
    <div className="space-y-6">
       <div className="h-32 bg-gradient-to-r from-[#064e3b] to-emerald-800 rounded-xl relative mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/10 pattern-grid opacity-30"></div>
          <div className="absolute -bottom-6 left-6 p-1.5 bg-white rounded-xl shadow-md">
             <div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center text-[#064e3b] border border-emerald-100">
                <Store size={32} />
             </div>
          </div>
       </div>
       
       <div className="pl-2 pt-2">
          <h2 className="text-2xl font-bold text-gray-900">{shop.name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
             <span className="flex items-center gap-1"><MapPin size={14} className="text-[#064e3b]"/> {shop.location}</span>
             <span className="flex items-center gap-1"><Phone size={14}/> {shop.phone}</span>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
             <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2"><Layers size={14}/> Operations</h3>
             <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                <div>
                   <span className="text-[10px] text-gray-400 block mb-0.5 uppercase">Type</span>
                   <span className="font-medium text-gray-900">{shop.shopType || 'Retail'}</span>
                </div>
                <div>
                   <span className="text-[10px] text-gray-400 block mb-0.5 uppercase">Size</span>
                   <span className="font-medium text-gray-900">{shop.squareFootage ? `${shop.squareFootage} sq ft` : '-'}</span>
                </div>
                <div className="col-span-2">
                   <span className="text-[10px] text-gray-400 block mb-0.5 uppercase">Full Address</span>
                   <span className="font-medium text-gray-900">{shop.address}</span>
                </div>
                <div className="col-span-2">
                   <span className="text-[10px] text-gray-400 block mb-0.5 uppercase">Opening Hours</span>
                   <span className="font-medium text-gray-900 flex items-center gap-2"><Clock size={14} className="text-green-500"/> {shop.operatingHours || '09:00 - 21:00'}</span>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-blue-900 text-xs uppercase tracking-wide">Assigned Vendor</h3>
                   <button onClick={() => setIsAssignDialogOpen(true)} className="text-[10px] bg-white text-blue-600 px-2 py-1 rounded border border-blue-200 font-bold hover:bg-blue-100">
                      {shop.assignedVendorName ? 'Change' : 'Assign'}
                   </button>
                </div>
                {shop.assignedVendorName ? (
                   <div>
                      <p className="font-bold text-base text-blue-900">{shop.assignedVendorName}</p>
                      <p className="text-xs text-blue-600/80 mt-1">Vendor ID: {shop.assignedVendorId?.slice(0,8)}</p>
                   </div>
                ) : (
                   <div className="flex items-center gap-2 text-blue-400 italic text-sm">
                      <ShieldCheck size={16}/> No vendor assigned
                   </div>
                )}
             </div>
             
             <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{shop.manager[0]}</div>
                <div>
                   <p className="text-[10px] text-gray-400 uppercase font-bold">Store Manager</p>
                   <p className="font-bold text-sm text-gray-900">{shop.manager}</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 md:p-0">
        <div className="bg-white w-[95%] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in md:w-full max-h-[65vh] md:h-auto md:max-w-2xl">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50/80 shrink-0">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{type} DETAILS VIEW</span>
             <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 hover:shadow-sm transition-all"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-white">
             {type === 'product' && renderProductDetails(data)}
             {type === 'vendor' && renderVendorDetails(data)}
             {type === 'shop' && renderShopDetails(data)}
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
             <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 hover:shadow-sm transition-all">Close Details</button>
          </div>
        </div>
      </div>
      
      {isAssignDialogOpen && (
        <AssignDialog 
          isOpen={isAssignDialogOpen} 
          onClose={() => setIsAssignDialogOpen(false)} 
          sourceId={data.id} 
          sourceName={data.name} 
          type={type === 'vendor' ? 'VENDOR_TO_SHOP' : 'SHOP_TO_VENDOR'} 
        />
      )}
    </>
  );
};

export default ViewDetailsModal;