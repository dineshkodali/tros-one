import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { useNotification } from "../contexts/NotificationContext";

interface BulkAssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
  targetType: "VENDOR" | "SHOP";
}

const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({
  isOpen,
  onClose,
  selectedProductIds,
  targetType,
}) => {
  const { triggerSonar } = useNotification();
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTargets = async () => {
      const colName = targetType === "VENDOR" ? "vendors" : "shops";
      const snap = await getDocs(collection(db, colName));
      setTargets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetchTargets();
  }, [isOpen, targetType]);

  const handleBulkAssign = async () => {
    if (!selectedTargetId) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const target = targets.find((t) => t.id === selectedTargetId);

      selectedProductIds.forEach((prodId) => {
        const ref = doc(db, "products", prodId);
        if (!target) return;

        if (targetType === "VENDOR") {
          batch.update(ref, { vendor: target.email || target.name });
        } else {
          batch.update(ref, { assignedShop: target.name, shopId: target.id });
        }
      });

      await batch.commit();
      triggerSonar(
        `Assigned ${selectedProductIds.length} products successfully`
      );
      onClose();
    } catch (e) {
      console.error(e);
      triggerSonar("Bulk assignment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              Bulk Assign Products
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Assign {selectedProductIds.length} items to a{" "}
              {targetType.toLowerCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select {targetType === "VENDOR" ? "Vendor" : "Shop"}
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-mono-primary"
            >
              <option value="">Choose...</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProductIds.length > 50 && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-xs">
              <AlertTriangle size={16} />
              Processing large batches may take a moment.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 ml-20"
          >
            Cancel
          </button>

          <button
            onClick={handleBulkAssign}
            disabled={!selectedTargetId || loading}
            className="ml-auto px-6 py-2 bg-mono-primary text-white text-sm font-bold rounded-lg disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BulkAssignDialog;
