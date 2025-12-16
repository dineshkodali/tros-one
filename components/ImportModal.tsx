import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertTriangle, Loader2, Download } from 'lucide-react';
import { parseCSV, exportToCSV } from '../utils/csv';
import { db } from '../firebase';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { useNotification } from '../contexts/NotificationContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
  fields: { key: string; label: string }[];
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, collectionName, fields }) => {
  const { triggerSonar } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    // Create a dummy row with empty strings for the keys
    const templateRow = fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});
    // Using existing export utility to download a CSV with just headers
    exportToCSV([templateRow], `${collectionName}_template`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    
    try {
      const data = await parseCSV(selectedFile);
      if (data.length === 0) {
        setError("File appears to be empty or invalid format.");
      } else {
        setPreviewData(data.slice(0, 5)); // Show first 5 rows preview
      }
    } catch (err) {
      setError("Failed to parse CSV file. Please ensure it follows the template.");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fullData = await parseCSV(file);
      const batchSize = 500;
      const chunks = [];
      
      // Batch writes
      for (let i = 0; i < fullData.length; i += batchSize) {
        chunks.push(fullData.slice(i, i + batchSize));
      }

      let count = 0;
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          // Validate required fields roughly
          if (item.name) { 
             const newRef = doc(collection(db, collectionName));
             batch.set(newRef, {
               ...item,
               createdAt: new Date().toISOString(),
               status: item.status || 'Active' // Default status
             });
             count++;
          }
        });
        await batch.commit();
      }

      triggerSonar(`Successfully imported ${count} items to ${collectionName}`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Import failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-bold text-xl text-gray-900">Bulk Import {collectionName}</h3>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV file to add multiple items.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Step 1: Template */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FileText size={18}/></div>
             <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900">Step 1: Get the Template</h4>
                <p className="text-xs text-blue-700 mt-1 mb-3">Download the standard CSV format to ensure your data is imported correctly.</p>
                <button onClick={handleDownloadTemplate} className="text-xs font-bold bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm">
                   <Download size={14}/> Download Template
                </button>
             </div>
          </div>

          {/* Step 2: Upload */}
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'}`}>
             <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
             
             {!file ? (
               <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                     <UploadCloud size={24}/>
                  </div>
                  <p className="text-sm font-bold text-gray-700">Click to upload CSV</p>
                  <p className="text-xs text-gray-400 mt-1">Maximum 5MB</p>
               </div>
             ) : (
               <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={18}/></div>
                     <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{file.name}</p>
                        <p className="text-xs text-gray-500">Ready to import</p>
                     </div>
                  </div>
                  <button onClick={() => { setFile(null); setPreviewData([]); setError(null); }} className="text-gray-400 hover:text-red-500 p-1"><X size={16}/></button>
               </div>
             )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
               <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
               {error}
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
             <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Preview (First 5 rows)</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                   <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-700">
                         <tr>
                            {Object.keys(previewData[0]).slice(0, 3).map(k => <th key={k} className="p-2 font-semibold capitalize">{k}</th>)}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {previewData.map((row, i) => (
                            <tr key={i} className="bg-white">
                               {Object.values(row).slice(0, 3).map((v: any, idx) => <td key={idx} className="p-2 text-gray-600 truncate max-w-[100px]">{v}</td>)}
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
           <button 
             onClick={handleImport} 
             disabled={!file || isProcessing} 
             className="px-6 py-2.5 bg-mono-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-mono-secondary disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
           >
             {isProcessing && <Loader2 size={16} className="animate-spin" />}
             {isProcessing ? 'Importing...' : 'Start Import'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;