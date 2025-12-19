import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, CheckSquare, Square } from "lucide-react";
import { exportToCSV } from "../utils/csv";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  collectionName: string;
  columns: { key: string; label: string }[];
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
  collectionName,
  columns,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map((c) => c.key)
  );
  const [sortBy, setSortBy] = useState<string>(columns[0]?.key || "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleExport = () => {
    const sortedData = [...data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    const finalData = sortedData.map((item) => {
      const filteredItem: any = {};
      selectedColumns.forEach((key) => {
        if (key === "_assignments") {
          filteredItem["Assigned"] =
            item[key]?.map((x: any) => x.name).join(", ") || "";
        } else {
          filteredItem[key] = item[key];
        }
      });
      return filteredItem;
    });

    exportToCSV(finalData, collectionName);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Centering wrapper – DO NOT TOUCH */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-lg text-gray-900">
              Export {collectionName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Column Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Select Columns
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 border rounded-md">
                {columns.map((col) => (
                  <div
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    {selectedColumns.includes(col.key) ? (
                      <CheckSquare size={16} className="text-mono-primary" />
                    ) : (
                      <Square size={16} className="text-gray-300" />
                    )}
                    <span className="text-sm text-gray-700">
                      {col.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-mono-primary outline-none"
                >
                  {columns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Order
                </label>
                <select
                  value={sortDir}
                  onChange={(e) =>
                    setSortDir(e.target.value as "asc" | "desc")
                  }
                  className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-mono-primary outline-none"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-mono-primary text-white text-sm font-bold rounded-lg hover:bg-mono-secondary flex items-center gap-2"
            >
              <Download size={16} /> Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
};

export default ExportModal;
