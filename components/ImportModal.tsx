import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
} from "lucide-react";
import { parseCSV, exportToCSV } from "../utils/csv";
import { db } from "../firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { useNotification } from "../contexts/NotificationContext";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
  fields: { key: string; label: string }[];
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  collectionName,
  fields,
}) => {
  const { triggerSonar } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateRow = fields.reduce(
      (acc, field) => ({ ...acc, [field.key]: "" }),
      {}
    );
    exportToCSV([templateRow], `${collectionName}_template`);
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const data = await parseCSV(selectedFile);
      if (!data.length) {
        setError("File appears to be empty or invalid format.");
      } else {
        setPreviewData(data.slice(0, 5));
      }
    } catch {
      setError("Failed to parse CSV file.");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fullData = await parseCSV(file);
      const batchSize = 500;

      for (let i = 0; i < fullData.length; i += batchSize) {
        const batch = writeBatch(db);
        fullData.slice(i, i + batchSize).forEach((item) => {
          if (item.name) {
            const ref = doc(collection(db, collectionName));
            batch.set(ref, {
              ...item,
              createdAt: new Date().toISOString(),
              status: item.status || "Active",
            });
          }
        });
        await batch.commit();
      }

      triggerSonar(
        `Successfully imported ${fullData.length} items to ${collectionName}`
      );
      onClose();
    } catch (err: any) {
      setError("Import failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      {/* ⛔ MODAL STRUCTURE UNCHANGED */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-bold text-xl text-gray-900">
              Bulk Import {collectionName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload a CSV file to add multiple items.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Template */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-900">
                Step 1: Get the Template
              </h4>
              <p className="text-xs text-blue-700 mt-1 mb-3">
                Download the standard CSV format to ensure your data is imported correctly.
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="text-xs font-bold bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              >
                <Download size={14} /> Download Template
              </button>
            </div>
          </div>

          {/* Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              file
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            {!file ? (
              <div className="flex flex-col items-center">
                <UploadCloud size={28} className="text-gray-400 mb-2" />
                <p className="text-sm font-bold text-gray-700">
                  Click to upload CSV
                </p>
                <p className="text-xs text-gray-400 mt-1">Maximum 5MB</p>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold truncate max-w-[180px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">Ready to import</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setError(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="flex gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 bg-mono-primary text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            {isProcessing ? "Importing..." : "Start Import"}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default ImportModal;
