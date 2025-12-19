import React, { useState, useEffect } from 'react';
import { X, Save, Check, Search, Store, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, documentId } from 'firebase/firestore';
import { useNotification } from '../contexts/NotificationContext';
import {createPortal} from 'react-dom';
interface AssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId: string;
  sourceName: string;
  type: 'VENDOR_TO_SHOP' | 'SHOP_TO_VENDOR'; 
}

const AssignDialog: React.FC<AssignDialogProps> = ({ isOpen, onClose, sourceId, sourceName, type }) => {
  const { triggerSonar } = useNotification();
  const [items, setItems] = useState<any[]>([]);
  // For VENDOR_TO_SHOP: array of shop IDs this vendor owns
  // For SHOP_TO_VENDOR: string ID of the single vendor
  const [assignmentState, setAssignmentState] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        if (type === 'SHOP_TO_VENDOR') {
          const vendorsSnap = await getDocs(collection(db, 'vendors'));
          setItems(vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
          
          const shopDoc = await getDocs(query(collection(db, 'shops'), where(documentId(), '==', sourceId)));
          if (!shopDoc.empty) {
             const sData = shopDoc.docs[0].data() as any;
             setAssignmentState(sData.assignedVendorId || null);
          }

        } else if (type === 'VENDOR_TO_SHOP') {
          const shopsSnap = await getDocs(collection(db, 'shops'));
          setItems(shopsSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));

          const assignedShopsQuery = query(collection(db, 'shops'), where('assignedVendorId', '==', sourceId));
          const assignedSnap = await getDocs(assignedShopsQuery);
          setAssignmentState(assignedSnap.docs.map(d => d.id));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, sourceId, type]);

  const handleToggle = async (itemId: string) => {
    try {
      if (type === 'SHOP_TO_VENDOR') {
        const shopRef = doc(db, 'shops', sourceId);
        const vendor = items.find(i => i.id === itemId);
        
        if (assignmentState === itemId) {
           await updateDoc(shopRef, { assignedVendorId: null, assignedVendorName: null });
           setAssignmentState(null);
           triggerSonar('Vendor unassigned');
        } else {
           await updateDoc(shopRef, { assignedVendorId: itemId, assignedVendorName: vendor?.name || 'Unknown' });
           setAssignmentState(itemId);
           triggerSonar(`Assigned to ${vendor?.name}`);
        }

      } else {
        const currentAssignedIds = (assignmentState as string[]) || [];
        const isCurrentlyAssigned = currentAssignedIds.includes(itemId);
        
        const shopRef = doc(db, 'shops', itemId);
        
        if (isCurrentlyAssigned) {
          await updateDoc(shopRef, { assignedVendorId: null, assignedVendorName: null });
          setAssignmentState(currentAssignedIds.filter(id => id !== itemId));
          triggerSonar('Shop unassigned');
        } else {
          await updateDoc(shopRef, { assignedVendorId: sourceId, assignedVendorName: sourceName });
          setAssignmentState([...currentAssignedIds, itemId]);
          triggerSonar('Shop assigned');
        }
      }
    } catch (e) {
      console.error(e);
      triggerSonar('Action failed', 'error');
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh] animate-zoom-in">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h3 className="font-bold text-lg text-gray-900">
                {type === 'SHOP_TO_VENDOR' ? 'Assign Vendor' : 'Assign Shops'}
            </h3>
            <p className="text-xs text-gray-500">
                {type === 'SHOP_TO_VENDOR' ? `Select the vendor for ${sourceName}` : `Select shops managed by ${sourceName}`}
            </p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-mono-primary/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
            <div className="space-y-1">
              {filteredItems.map(item => {
                let isAssigned = false;
                if (type === 'SHOP_TO_VENDOR') {
                    isAssigned = assignmentState === item.id;
                } else {
                    isAssigned = (assignmentState as string[])?.includes(item.id);
                }

                const assignedToSomeoneElse = type === 'VENDOR_TO_SHOP' && item.assignedVendorId && item.assignedVendorId !== sourceId;

                return (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isAssigned ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2 rounded-full ${isAssigned ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {type === 'SHOP_TO_VENDOR' ? <User size={16}/> : <Store size={16}/>}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                            {assignedToSomeoneElse && (
                                <span className="text-[10px] text-red-500 truncate">Assigned to: {item.assignedVendorName}</span>
                            )}
                        </div>
                    </div>
                    
                    <button 
                      onClick={() => handleToggle(item.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${isAssigned ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-mono-primary text-white hover:bg-mono-secondary'}`}
                    >
                      {isAssigned ? 'Revoke' : (assignedToSomeoneElse ? 'Reassign' : 'Assign')}
                    </button>
                  </div>
                )
              })}
              {filteredItems.length === 0 && <p className="text-center py-4 text-sm text-gray-400">No items found</p>}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AssignDialog;