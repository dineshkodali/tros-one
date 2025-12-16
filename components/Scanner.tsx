import React, { useState } from 'react';
import { Camera, RefreshCw, X, Plus, Package, CheckCircle } from 'lucide-react';
import { MOCK_PRODUCTS } from '../constants';
import { Product } from '../types';

const Scanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<Product | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'SCAN' | 'RESULT' | 'FORM'>('SCAN');

  const startScan = () => {
    setIsScanning(true);
    setViewMode('SCAN');
    
    // Simulate scan success
    setTimeout(() => {
      const mockBarcodes = ['123456789', '999999999']; // 123456789 exists, 999999999 is new
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      
      const product = MOCK_PRODUCTS.find(p => p.barcode === randomBarcode);
      
      setScannedBarcode(randomBarcode);
      setFoundProduct(product);
      setIsScanning(false);
      setViewMode(product ? 'RESULT' : 'FORM');
    }, 2000);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save new product would go here
    alert("Product saved to database!");
    setScannedBarcode(null);
    setViewMode('SCAN');
  };

  return (
    <div className="flex flex-col h-full bg-mono-bg">
      {viewMode === 'SCAN' && (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in">
          <div className="w-64 h-64 bg-black/5 rounded-3xl flex items-center justify-center mb-8 relative overflow-hidden border-2 border-mono-light">
             {isScanning && (
               <>
                 <div className="absolute inset-0 bg-black/20 z-10"></div>
                 <div className="absolute w-full h-1 bg-[#064e3b] top-1/2 -translate-y-1/2 z-20 animate-pulse shadow-[0_0_15px_rgba(6,78,59,0.8)]"></div>
                 <p className="absolute bottom-4 left-0 right-0 text-white z-20 font-medium">Scanning via ML Kit...</p>
               </>
             )}
             <Camera className={`w-16 h-16 ${isScanning ? 'text-white/50' : 'text-mono-textSec'}`} />
          </div>
          
          <h2 className="text-xl font-bold text-mono-text mb-2">Barcode Scanner</h2>
          <p className="text-mono-textSec mb-6 max-w-sm">
            Point your camera at a product barcode (Code 128, EAN-13, QR).
          </p>

          <button 
            onClick={startScan}
            disabled={isScanning}
            className="bg-mono-primary text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-mono-primary/20 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            {isScanning ? 'Initializing...' : 'Tap to Scan'}
          </button>
        </div>
      )}

      {viewMode === 'RESULT' && foundProduct && (
        <div className="p-6 h-full flex flex-col items-center justify-center animate-in zoom-in duration-300">
           <div className="bg-green-100 p-4 rounded-full mb-6">
             <CheckCircle className="w-12 h-12 text-green-600" />
           </div>
           <h3 className="text-2xl font-bold text-mono-text mb-2">Product Found</h3>
           <p className="text-mono-textSec mb-8">Barcode: {scannedBarcode}</p>
           
           <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg border border-mono-light mb-8 text-left">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h4 className="text-lg font-bold text-mono-primary">{foundProduct.name}</h4>
                   <p className="text-sm text-mono-textSec">{foundProduct.brand}</p>
                </div>
                <span className="text-xl font-bold text-mono-text">${foundProduct.price.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <span className="block text-mono-textSec text-xs">Category</span>
                   <span className="font-medium">{foundProduct.category}</span>
                 </div>
                 <div>
                   <span className="block text-mono-textSec text-xs">Stock Level</span>
                   <span className={`font-medium ${foundProduct.stock <= foundProduct.minStock ? 'text-red-600' : 'text-green-600'}`}>{foundProduct.stock} Units</span>
                 </div>
                 <div>
                   <span className="block text-mono-textSec text-xs">SKU</span>
                   <span className="font-medium">{foundProduct.sku}</span>
                 </div>
                 <div>
                   <span className="block text-mono-textSec text-xs">Vendor</span>
                   <span className="font-medium">{foundProduct.vendor}</span>
                 </div>
                 <div>
                   <span className="block text-mono-textSec text-xs">Origin</span>
                   <span className="font-medium">{foundProduct.origin}</span>
                 </div>
                 <div>
                   <span className="block text-mono-textSec text-xs">Expiry</span>
                   <span className="font-medium">{foundProduct.expiryDate}</span>
                 </div>
              </div>
           </div>
           
           <div className="flex gap-3 w-full max-w-md">
             <button onClick={() => setViewMode('SCAN')} className="flex-1 px-6 py-3 border border-mono-light rounded-lg hover:bg-mono-light transition-colors font-medium">Scan Again</button>
             <button className="flex-1 px-6 py-3 bg-mono-primary text-white rounded-lg hover:bg-mono-secondary transition-colors font-medium">Update Stock</button>
           </div>
        </div>
      )}

      {viewMode === 'FORM' && (
        <div className="p-6 h-full flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 mb-6 text-mono-primary">
            <Package className="w-6 h-6" />
            <h2 className="text-xl font-bold">New Product Found</h2>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full"><Plus className="w-4 h-4 text-blue-600" /></div>
            <div>
              <p className="text-sm font-medium text-blue-800">Barcode {scannedBarcode} not in database.</p>
              <p className="text-xs text-blue-600 mt-1">Please fill in details to register.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20">
             <div className="space-y-1">
               <label className="text-sm font-medium text-mono-textSec">Barcode</label>
               <input type="text" value={scannedBarcode || ''} readOnly className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-mono-textSec cursor-not-allowed" />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-mono-textSec">Product Name *</label>
               <input type="text" required className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-mono-primary focus:outline-none" placeholder="e.g. Energy Drink" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-sm font-medium text-mono-textSec">Price *</label>
                 <input type="number" step="0.01" required className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-mono-primary focus:outline-none" placeholder="0.00" />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-mono-textSec">Cost Price</label>
                 <input type="number" step="0.01" className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-mono-primary focus:outline-none" placeholder="0.00" />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-mono-textSec">Quantity *</label>
                 <input type="number" required className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-mono-primary focus:outline-none" placeholder="0" />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-mono-textSec">Min Stock</label>
                 <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-mono-primary focus:outline-none" placeholder="10" />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-mono-textSec">Category</label>
               <select className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-mono-primary focus:outline-none">
                 <option>Select Category...</option>
                 <option>Beverages</option>
                 <option>Snacks</option>
                 <option>Electronics</option>
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-mono-textSec">Description</label>
               <textarea className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-mono-primary focus:outline-none" rows={3} placeholder="Short description..."></textarea>
             </div>

             <div className="pt-4 flex gap-3">
               <button type="button" onClick={() => setViewMode('SCAN')} className="flex-1 py-3 border border-mono-light rounded-lg text-mono-textSec font-medium">Cancel</button>
               <button type="submit" className="flex-1 py-3 bg-mono-primary text-white rounded-lg hover:bg-mono-secondary font-bold shadow-md">Save Product</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Scanner;