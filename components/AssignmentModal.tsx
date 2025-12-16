import React, { useState, useEffect } from 'react';
import { X, Store, Users, Check, Search, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { Assignment, Vendor, Shop } from '../types';
import { MOCK_VENDORS, MOCK_SHOPS } from '../constants';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceItem: Vendor | Shop;
  type: 'vendor' | 'shop'; // 'vendor' means we are assigning shops TO this vendor.
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, sourceItem, type }) => {
  const [items, setItems] = useState<(Vendor | Shop)[]>([]); // List of all candidates (e.g., all Shops)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    
    // Determine collections
    const targetCollection = type === 'vendor' ? 'shops' : 'vendors';
    
    // 1. Fetch Candidates
    const unsubscribeItems = onSnapshot(collection(db, targetCollection), (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Vendor | Shop)[];
      setItems(fetchedItems);
    }, (error) => {
      console.warn("Assignment candidates fetch error (Demo Mode):", error.message);
      if (targetCollection === 'shops') setItems(MOCK_SHOPS);
      else setItems(MOCK_VENDORS);
    });

    // 2. Fetch Existing Assignments
    // We query the 'assignments' collection where sourceId matches
    const qField = type === 'vendor' ? 'vendorId' : 'shopId';
    const q = query(collection(db, 'assignments'), where(qField, '==', sourceItem.id));
    
    const unsubscribeAssignments = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedAssignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(fetchedAssignments);
      setLoading(false);
    }, (error) => {
      console.warn("Assignments fetch error (Demo Mode):", error.message);
      setAssignments([]); // No assignments in demo mode for now
      setLoading(false);
    });

    return () => {
      unsubscribeItems();
      unsubscribeAssignments();
    };
  }, [isOpen, sourceItem.id, type]);

  const handleToggle = async (targetItem: Vendor | Shop) => {
    setProcessingId(targetItem.id);
    setMessage(null);

    const targetIdField = type === 'vendor' ? 'shopId' : 'vendorId';
    const sourceIdField = type === 'vendor' ? 'vendorId' : 'shopId';
    
    // Check if already assigned
    const existingAssignment = assignments.find(a => 
      (type === 'vendor' ? a.shopId === targetItem.id : a.vendorId === targetItem.id)
    );

    try {
      if (existingAssignment) {
        // Unassign
        await deleteDoc(doc(db, 'assignments', existingAssignment.id));
        setMessage({ type: 'success', text: `${type === 'vendor' ? 'Shop' : 'Vendor'} unassigned successfully` });
      } else {
        // Assign
        await addDoc(collection(db, 'assignments'), {
          [sourceIdField]: sourceItem.id,
          [targetIdField]: targetItem.id,
          createdAt: new Date().toISOString()
        });
        setMessage({ type: 'success', text: `${type === 'vendor' ? 'Shop' : 'Vendor'} assigned successfully` });
      }
    } catch (error) {
      console.error("Assignment error:", error);
      setMessage({ type: 'error', text: `Failed to update assignment (Demo Mode Restricted)` });
    } finally {
      setProcessingId(null);
      // Clear message after 3s
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl w-full max-w-lg border animate-zoom-in overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b flex justify-between items-center bg-muted/20">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {type === 'vendor' ? <Store className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              Assign {type === 'vendor' ? 'Shops' : 'Vendors'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {type === 'vendor' ? `Assigning shops to ${sourceItem.name}` : `Assigning vendors to ${sourceItem.name}`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
           <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <input
               type="text"
               placeholder={`Search ${type === 'vendor' ? 'shops' : 'vendors'}...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
             />
           </div>
           {message && (
             <div className={`mt-3 p-2 rounded-md text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {message.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
               {message.text}
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
           {loading ? (
             <div className="text-center py-8 text-muted-foreground">Loading...</div>
           ) : filteredItems.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No items found.</div>
           ) : (
             filteredItems.map(item => {
               const isAssigned = assignments.some(a => 
                 type === 'vendor' ? a.shopId === item.id : a.vendorId === item.id
               );
               const isProcessing = processingId === item.id;

               return (
                 <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isAssigned ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${isAssigned ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                         {type === 'vendor' ? <Store size={16} /> : <Users size={16} />}
                       </div>
                       <div>
                         <p className="font-medium text-sm">{item.name}</p>
                         <p className="text-xs text-muted-foreground">
                            {isAssigned ? 'Assigned' : 'Not Assigned'}
                         </p>
                       </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={isProcessing}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                        isAssigned 
                          ? 'border-destructive/30 text-destructive hover:bg-destructive/10' 
                          : 'border-primary/30 text-primary hover:bg-primary/10'
                      } disabled:opacity-50`}
                    >
                      {isProcessing ? '...' : isAssigned ? 'Unassign' : 'Assign'}
                    </button>
                 </div>
               );
             })
           )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;