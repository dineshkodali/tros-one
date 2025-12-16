import React, { useState } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface RequestChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  collectionName: string;
}

const RequestChangeModal: React.FC<RequestChangeModalProps> = ({ isOpen, onClose, targetId, targetName, collectionName }) => {
  const { currentUser } = useAuth();
  const { triggerSonar } = useNotification();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'change_requests'), {
        vendorId: currentUser?.uid || 'unknown',
        vendorName: currentUser?.email || 'Vendor',
        targetCollection: collectionName,
        targetId,
        targetName,
        requestType: 'UPDATE_INFO',
        description,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      triggerSonar('Request submitted to Admin');
      onClose();
    } catch (error) {
      console.error(error);
      triggerSonar('Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-zoom-in border border-gray-100">
        <div className="bg-[#064e3b] p-6 text-white flex justify-between items-start">
           <div>
              <h3 className="font-bold text-xl flex items-center gap-2"><MessageSquare size={20}/> Request Changes</h3>
              <p className="text-emerald-200 text-xs mt-1">For {targetName}</p>
           </div>
           <button onClick={onClose} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition-colors"><X size={16}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-xs leading-relaxed">
              <strong>Note:</strong> You cannot edit core product details directly. Please describe the changes needed (e.g., "Change price to $10", "Update name to..."). An administrator will review your request.
           </div>

           <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description of Changes</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#064e3b] focus:bg-white transition-all outline-none resize-none"
                placeholder="Please update the price to $15.50 and fix the spelling in the brand name..."
              />
           </div>

           <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-3 bg-[#064e3b] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                Submit Request
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default RequestChangeModal;