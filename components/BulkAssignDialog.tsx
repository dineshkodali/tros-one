import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Store } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useNotification } from '../contexts/NotificationContext';

interface BulkAssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
  targetType: 'VENDOR' | 'SHOP'; // We can now support assigning products to Shops
}

const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({ isOpen, onClose, selectedProductIds, targetType }) => {
  const { triggerSonar } = useNotification();
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTargets = async () => {
      // If we are assigning products TO a Vendor, fetch Vendors.
      // If we are assigning products TO a Shop (stocking), fetch Shops.
      const colName = targetType === 'VENDOR' ? 'vendors' : 'shops';
      const snap = await getDocs(collection(db, colName));
      setTargets(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
    };
    fetchTargets();
  }, [isOpen, targetType]);

  const handleBulkAssign = async () => {
    if (!selectedTargetId) return;
    setLoading(true);
    
    try {
      const batch = writeBatch(db);
      const target = targets.find(t => t.id === selectedTargetId);

      selectedProductIds.forEach(prodId => {
        const prodRef = doc(db, 'products', prodId);
        
        if (targetType === 'VENDOR') {
           // Update vendor string
           if (target) {
             batch.update(prodRef, { vendor: target.email || target.name }); 
           }
        } else if (targetType === 'SHOP') {
           // Update inventory logic? 
           // For TROS, products are global but maybe we set a 'assignedShopId' if exclusive?
           // Or strictly speaking, TROS products are global catalog.
           // Assuming this request means "Allow this shop to sell this product" or similar.
           // For now, let's assume we tag the product with the shop name for visibility.
           if (target) {
             batch.update(prodRef, { assignedShop: target.name, shopId: target.id });
           }
        }
      });

      await batch.commit();
      triggerSonar(`Assigned ${selectedProductIds.length} products successfully`);
      onClose();
    } catch (e) {
      console.error(e);
      triggerSonar('Bulk assignment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl flex flex-col animate-zoom-in">
        <div className="p-5 border-b">
          <h3 className="font-bold text-lg text-gray-900">Bulk Assign Products</h3>
          <p className="text-sm text-gray-500">Assign {selectedProductIds.length} items to a {targetType.toLowerCase()}</p>
        </div>
        
        <div className="p-5 space-y-4">
           <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700">Select {targetType === 'VENDOR' ? 'Vendor' : 'Shop'}</label>
             <select 
               className="w-full p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-mono-primary"
               value={selectedTargetId}
               onChange={e => setSelectedTargetId(e.target.value)}
             >
               <option value="">Choose...</option>
               {targets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
           </div>
           
           {selectedProductIds.length > 50 && (
             <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-xs">
               <AlertTriangle size={16} />
               Processing large batches may take a moment.
             </div>
           )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
           <button 
             onClick={handleBulkAssign} 
             disabled={!selectedTargetId || loading}
             className="px-6 py-2 bg-mono-primary text-white text-sm font-bold rounded-lg hover:bg-mono-secondary disabled:opacity-50"
           >
             {loading ? 'Assigning...' : 'Confirm Assignment'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignDialog;