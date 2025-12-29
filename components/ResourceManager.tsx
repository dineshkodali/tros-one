import React, { useState, useEffect, useRef, useMemo } from "react";
import { db, createSystemUser } from "../firebase";
import { createPortal } from "react-dom";

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  writeBatch,
  where,
  getDocs,
  setDoc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  WifiOff,
  Eye,
  Store,
  Users,
  Layers,
  FileText,
  Paperclip,
  MapPin,
  Phone,
  Upload,
  Tag,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  Package,
  Mail,
  User,
  DollarSign,
  Calendar,
  Barcode,
  Download,
  FileUp,
  MessageSquare,
} from "lucide-react";
import { UserRole } from "../types";
import { useAuth } from "../contexts/AuthContext";
import ConfirmationModal from "./ConfirmationModal";
import AssignDialog from "./AssignDialog";
import BulkAssignDialog from "./BulkAssignDialog";
import ViewDetailsModal from "./ViewDetailsModal";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
import RequestChangeModal from "./RequestChangeModal";
import { logActivity } from "../utils/logger";
import { useNotification } from "../contexts/NotificationContext";
import FilterBar from "./FilterBar";
import { CATEGORIES_DATA } from "../constants";

interface ResourceManagerProps {
  collectionName: string;
  title: string;
  subtitle?: string;
  fields: {
    key: string;
    label: string;
    type: "text" | "number" | "select" | "date" | "textarea";
    options?: string[];
  }[];
  displayColumns: {
    key: string;
    label: string;
    format?: (val: any, row?: any) => React.ReactNode;
  }[];
  onScan?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

const ResourceManager: React.FC<ResourceManagerProps> = ({
  collectionName,
  title,
  subtitle,
  fields,
  displayColumns,
  onScan,
}) => {
  const { userRole, currentUser } = useAuth();
  const { triggerSonar } = useNotification();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRequestChangeOpen, setIsRequestChangeOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [customFields, setCustomFields] = useState<
    { key: string; value: string }[]
  >([]);
  const [formDocs, setFormDocs] = useState<
    { name: string; url: string; date: string }[]
  >([]);
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [userPassword, setUserPassword] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    "basic" | "details" | "image" | "extra"
  >("basic");
  const [assignDialogState, setAssignDialogState] = useState<{
    isOpen: boolean;
    source: any;
    type: any;
  }>({ isOpen: false, source: null, type: null });
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Permissions Logic
  // Vendors CANNOT create new products. They can only view/edit assigned.
  const canCreate = userRole === UserRole.ADMIN;
  // Vendors CAN edit assigned products (but we restrict WHICH fields in the renderInput)
  const canEdit =
    userRole === UserRole.ADMIN ||
    (userRole === UserRole.VENDOR && collectionName === "products");
  const canDelete = userRole === UserRole.ADMIN; // Vendors should probably not delete products entirely, maybe just deactivate. Restricted for now.
  const canAssign = userRole === UserRole.ADMIN;
  const canImport =
    userRole === UserRole.ADMIN ||
    (userRole === UserRole.VENDOR && collectionName === "products"); // Vendors can bulk upload if needed (e.g. stock updates), or let's restrict to Admin for creation?
  // Requirement: "get option to bulk upload option... do same as shops, vendors"
  // Assuming Vendors can bulk upload stock/updates, or maybe new products if approved?
  // The prompt says "restrict vendor to add products". So Bulk Upload for Vendor should probably be disabled or restricted.
  // However, "get option to bulk upload" might imply they CAN.
  // Interpretation: "restrict vendor to add products... ALSO for products get option to bulk upload".
  // This implies the Bulk Upload is a feature of the *module*, but if Vendor is restricted from adding, they can't use it to ADD.
  // I will enable it for everyone, but if a Vendor uses it, I'll restrict it or maybe the prompt implies Admin use.
  // Actually, standard SaaS: Vendors usually bulk upload their catalog.
  // Let's enable Import for everyone, but if they are restricted from adding, the backend rules would block it.
  // For UI consistency with "restrict vendor to add", I will HIDE Import for Vendor on Products if they can't add.
  // But wait, "he can able to request for changes... also for products get option to bulk upload".
  // I'll enable Bulk Upload for everyone for now, as it's a requested feature.

  // Data Fetching
  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};
    const setupListeners = async () => {
      try {
        let q;
        if (collectionName === "products") {
          if (userRole === UserRole.VENDOR && currentUser?.email) {
            // Check if vendor email matches product vendor
            const vendorQ = query(
              collection(db, "vendors"),
              where("email", "==", currentUser.email)
            );
            const vendorSnap = await getDocs(vendorQ);

            if (!vendorSnap.empty) {
              q = query(
                collection(db, "products"),
                where("vendor", "==", currentUser.email)
              );
            } else {
              setData([]);
              setLoading(false);
              return;
            }
          } else {
            q = query(collection(db, "products"));
          }
        } else if (collectionName === "shops") {
          if (userRole === UserRole.ADMIN) {
            q = query(collection(db, "shops"));
          } else if (userRole === UserRole.VENDOR && currentUser?.email) {
            const vendorProfileQ = query(
              collection(db, "vendors"),
              where("email", "==", currentUser.email)
            );
            const vendorProfileSnap = await getDocs(vendorProfileQ);
            if (vendorProfileSnap.empty) {
              setData([]);
              setLoading(false);
              return;
            }
            const vendorDocId = vendorProfileSnap.docs[0].id;
            q = query(
              collection(db, "shops"),
              where("assignedVendorId", "==", vendorDocId)
            );
          }
        } else if (collectionName === "vendors") {
          if (userRole === UserRole.ADMIN) {
            q = query(collection(db, "vendors"));
          } else {
            setData([]);
            setLoading(false);
            return;
          }
        }

        if (q) {
          unsubscribe = onSnapshot(
            q,
            async (snapshot: QuerySnapshot<DocumentData>) => {
              const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              if (collectionName === "vendors" && userRole === UserRole.ADMIN) {
                const shopsSnap = await getDocs(collection(db, "shops"));
                const allShops = shopsSnap.docs.map((d) => d.data());
                items.forEach((v: any) => {
                  v._assignments = allShops.filter(
                    (s: any) => s.assignedVendorId === v.id
                  );
                });
              }
              setData(items);
              setIsOfflineMode(false);
              setLoading(false);
            },
            (error) => {
              console.warn("Fetch Error", error);
              if (error.code !== "permission-denied") setIsOfflineMode(true);
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    setupListeners();
    return () => unsubscribe();
  }, [collectionName, userRole, currentUser]);

  // Derived Data
  const processedData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lower)
        )
      );
    }

    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (val && val !== "") {
        if (key === "stockStatus" && collectionName === "products") {
          result = result.filter((item) => {
            const stock = Number(item.stock || 0);
            const min = Number(item.minStock || 0);
            if (val === "Low Stock") return stock <= min && stock > 0;
            if (val === "Out of Stock") return stock <= 0;
            if (val === "In Stock") return stock > min;
            return true;
          });
        } else {
          result = result.filter((item) => String(item[key]) === val);
        }
      }
    });

    result.sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [data, searchTerm, filters, sortConfig, collectionName]);

  // Dynamic Options
  const getFilterOptions = () => {
    if (collectionName === "products") {
      const usedCategories = Array.from(
        new Set(data.map((i) => i.category))
      ).filter(Boolean) as string[];
      const allCategories = Array.from(
        new Set([...Object.keys(CATEGORIES_DATA), ...usedCategories])
      ).sort();

      return [
        {
          key: "category",
          label: "Category",
          type: "select" as const,
          options: allCategories,
        },
        {
          key: "status",
          label: "Status",
          type: "select" as const,
          options: ["Active", "Inactive", "Out of Stock"],
        },
        {
          key: "stockStatus",
          label: "Inventory",
          type: "select" as const,
          options: ["In Stock", "Low Stock", "Out of Stock"],
        },
        { key: "brand", label: "Brand", type: "text" as const },
      ];
    }
    if (collectionName === "vendors") {
      return [
        {
          key: "status",
          label: "Status",
          type: "select" as const,
          options: ["Active", "Inactive"],
        },
        { key: "location", label: "Location", type: "text" as const },
      ];
    }
    if (collectionName === "shops") {
      return [
        {
          key: "status",
          label: "Status",
          type: "select" as const,
          options: ["Open", "Closed"],
        },
        { key: "location", label: "City", type: "text" as const },
      ];
    }
    return [];
  };

  const getSortOptions = () => {
    const common = [
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },
    ];
    if (collectionName === "products")
      return [
        ...common,
        { key: "price", label: "Price" },
        { key: "stock", label: "Stock Level" },
        { key: "category", label: "Category" },
        { key: "brand", label: "Brand" },
      ];
    if (collectionName === "vendors")
      return [...common, { key: "productsCount", label: "Product Count" }];
    return common;
  };

  // Handlers (Save, Delete, Add)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setCreatedCredentials(null);
    try {
      const payload = { ...formData };
      if (customFields.length > 0)
        payload.customFields = customFields.reduce(
          (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
          {}
        );
      if (formDocs.length > 0) payload.documents = formDocs;

      // If Vendor creating product, auto-assign vendor email
      if (
        userRole === UserRole.VENDOR &&
        collectionName === "products" &&
        !editingItem
      ) {
        payload.vendor = currentUser?.email;
      }

      if (collectionName === "vendors" && !editingItem && createUserAccount) {
        if (!formData.email || !userPassword)
          throw new Error("Email and Password required.");
        const uid = await createSystemUser(formData.email, userPassword);
        await setDoc(doc(db, "users", uid), {
          email: formData.email,
          role: "Vendor",
          createdAt: new Date().toISOString(),
          uid: uid,
        });
        payload.linkedUserId = uid;
        await logActivity(
          "SYSTEM",
          `Created new Login Account for ${formData.email}`,
          currentUser?.email || "Admin"
        );
        setCreatedCredentials({
          email: formData.email,
          password: userPassword,
        });
      }

      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), payload);
        triggerSonar(`${collectionName.slice(0, -1)} updated successfully`);
        setIsModalOpen(false);
      } else {
        await addDoc(collection(db, collectionName), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        triggerSonar(`New ${collectionName.slice(0, -1)} created`);
        if (!createUserAccount) setIsModalOpen(false);
      }
    } catch (error: any) {
      alert("Failed to save: " + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteDoc(doc(db, collectionName, itemToDelete));
        await logActivity(
          "SYSTEM",
          `Deleted item from ${collectionName}`,
          currentUser?.email || "Admin"
        );
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        triggerSonar("Item deleted successfully", "error");
      } catch (error) {
        alert("Failed to delete item.");
      }
    }
  };

  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item || {});
    setCustomFields(
      item?.customFields
        ? Object.entries(item.customFields).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        : []
    );
    setFormDocs(item?.documents || []);
    setActiveTab("basic");
    setCreateUserAccount(false);
    setUserPassword("");
    setCreatedCredentials(null);
    setIsModalOpen(true);
  };

  const handleAddCustomField = () =>
    setCustomFields([...customFields, { key: "", value: "" }]);
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0])
      setFormDocs([
        ...formDocs,
        {
          name: e.target.files[0].name,
          date: new Date().toLocaleDateString(),
          url: "#",
        },
      ]);
  };

  const renderInput = (
    key: string,
    label: string,
    type: string = "text",
    placeholder = "",
    required = false,
    options: string[] = []
  ) => {
    // Determine if field should be disabled based on role restrictions
    let disabled = false;
    if (
      userRole === UserRole.VENDOR &&
      collectionName === "products" &&
      editingItem
    ) {
      // Vendors can only edit stock, minStock, and status directly
      // OTHER fields must be requested via change request
      if (!["stock", "minStock", "status"].includes(key)) {
        disabled = true;
      }
    }

    const baseClasses = `w-full h-11 px-4 rounded-xl border text-sm focus:ring-2 outline-none transition-all placeholder:text-gray-400 ${
      disabled
        ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
        : "bg-white border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500/20"
    }`;

    if (type === "select") {
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide ml-1">
            {label} {required && "*"}
          </label>
          <div className="relative">
            <select
              disabled={disabled}
              value={formData[key] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [key]: e.target.value })
              }
              className={`${baseClasses} appearance-none`}
            >
              <option value="">Select {label}</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronRight
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
              size={16}
            />
          </div>
        </div>
      );
    }
    if (type === "textarea")
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide ml-1">
            {label} {required && "*"}
          </label>
          <textarea
            disabled={disabled}
            required={required}
            value={formData[key] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [key]: e.target.value })
            }
            className={`${baseClasses} min-h-[120px] py-3`}
            placeholder={placeholder}
          />
        </div>
      );
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide ml-1">
          {label} {required && "*"}
        </label>
        <input
          disabled={disabled}
          type={type}
          required={required}
          value={formData[key] || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              [key]:
                type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
          className={baseClasses}
          placeholder={placeholder}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col pb-24 md:pb-0 h-full flex flex-col px-1 sm:px-2 md:px-0">

      <input type="file" ref={fileInputRef} className="hidden" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 md:p-4 rounded-2xl border border-emerald-100 shadow-sm">

        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-[#022c22]">
            {title}
            {isOfflineMode && (
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                <WifiOff size={12} /> Offline
              </span>
            )}
          </h2>
          <p className="text-emerald-700/70 mt-1 font-medium">{subtitle}</p>
        </div>
        {/* <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setIsImportModalOpen(true)} className="flex-1 md:flex-none h-11 px-6 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"><FileUp size={18}/> Import</button>
          <button onClick={() => setIsExportModalOpen(true)} className="flex-1 md:flex-none h-11 px-6 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"><Download size={18} /> Export</button>
          {collectionName === 'products' && canAssign && <button onClick={() => setIsBulkAssignOpen(true)} className="flex-1 md:flex-none h-11 px-6 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"><Layers size={18} /> Bulk</button>}
          {canCreate && <button onClick={() => openModal()} className="flex-1 md:flex-none h-11 px-6 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center gap-2"><Plus size={18} /> Add New</button>}
        </div> */}
        <div className="w-full flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:w-auto">
          {/* Secondary actions */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 md:flex-none h-9 px-3 bg-white border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-2"
            >
              <FileUp size={16} /> Import
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex-1 md:flex-none h-9 px-3 bg-white border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-2"
            >
              <Download size={16} /> Export
            </button>

            {collectionName === "products" && canAssign && (
              <button
                onClick={() => setIsBulkAssignOpen(true)}
                className="flex-1 md:flex-none h-9 px-3 bg-white border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-2"
              >
                <Layers size={16} /> Bulk
              </button>
            )}
          </div>

          {/* Primary action */}
          {canCreate && (
            <button
              onClick={() => openModal()}
              className="w-full md:w-auto h-12 px-6 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add New
            </button>
          )}
        </div>
      </div>
      <div className="mt-0 md:mt-3">
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={getFilterOptions()}
        filters={filters}
        onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        sortOptions={getSortOptions()}
        sortConfig={sortConfig}
        onSortChange={(key, direction) => setSortConfig({ key, direction })}
      />
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="block md:hidden space-y-4 px-2 -mx-2">

        {loading ? (
          <div className="text-center py-12 text-emerald-400 font-medium">
            Loading items...
          </div>
        ) : (
          processedData.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden active:scale-98 transition-transform"
              onClick={() => {
                setViewingItem(row);
                setIsViewModalOpen(true);
              }}
            >
              <div className="p-3 md:p-5">

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                        collectionName === "products"
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                          : collectionName === "vendors"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                          : "bg-gradient-to-br from-amber-500 to-orange-600"
                      }`}
                    >
                      {collectionName === "products" ? (
                        <Package size={24} />
                      ) : collectionName === "vendors" ? (
                        <User size={24} />
                      ) : (
                        <Store size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">
                        {row.name}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {row.sku || row.email || row.location}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      row.status === "Active" || row.status === "Open"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : row.status === "Out of Stock"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {collectionName === "products" && (
                    <>
                      <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-50">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block mb-1">
                          Retail Price
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          ${row.price?.toFixed(2)}
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-lg border ${
                          row.stock <= row.minStock
                            ? "bg-red-50 border-red-100"
                            : "bg-emerald-50/50 border-emerald-50"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase block mb-1 ${
                            row.stock <= row.minStock
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          Stock Level
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            row.stock <= row.minStock
                              ? "text-red-700"
                              : "text-gray-900"
                          }`}
                        >
                          {row.stock} Units
                        </span>
                      </div>
                    </>
                  )}
                  {collectionName === "vendors" && (
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 col-span-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                        Contact
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {row.phone}
                      </span>
                    </div>
                  )}
                  {collectionName === "shops" && (
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 col-span-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                        Manager
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {row.manager}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="grid grid-cols-3 divide-x divide-emerald-50 border-t border-emerald-100 bg-gray-50/40">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingItem(row);
                    setIsViewModalOpen(true);
                  }}
                  className="py-3 text-xs font-bold text-gray-600 hover:bg-white hover:text-emerald-600 transition-colors"
                >
                  Details
                </button>
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(row);
                    }}
                    className="py-3 text-xs font-bold text-gray-600 hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(row.id);
                    }}
                    className="py-3 text-xs font-bold text-gray-600 hover:bg-white hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {processedData.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-emerald-100">
            No records found.
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:flex flex-col flex-1 bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-emerald-500 font-medium">
            Loading data...
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#064e3b] text-white sticky top-0 z-20 shadow-md">
                <tr>
                  {displayColumns.map((col, idx) => (
                    <th
                      key={idx}
                      className="h-14 px-6 font-bold tracking-wide whitespace-nowrap first:rounded-tl-lg"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="h-14 px-6 text-right font-bold tracking-wide sticky right-0 bg-[#064e3b] shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.3)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {processedData.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`group transition-all hover:bg-emerald-50/60 cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                    }`}
                    onClick={() => {
                      setViewingItem(row);
                      setIsViewModalOpen(true);
                    }}
                  >
                    {displayColumns.map((col, idx) => (
                      <td
                        key={idx}
                        className="p-4 px-6 align-middle text-gray-700 whitespace-nowrap group-hover:text-emerald-950 transition-colors"
                      >
                        {col.format
                          ? col.format(row[col.key], row)
                          : row[col.key]}
                      </td>
                    ))}
                    <td className="p-4 px-6 align-middle text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-emerald-50/60 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.02)] transition-colors">
                      <div
                        className="flex justify-end gap-2 items-center opacity-60 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(collectionName === "vendors" ||
                          collectionName === "shops") &&
                          canAssign && (
                            <button
                              onClick={() =>
                                setAssignDialogState({
                                  isOpen: true,
                                  source: row,
                                  type:
                                    collectionName === "vendors"
                                      ? "VENDOR_TO_SHOP"
                                      : "SHOP_TO_VENDOR",
                                })
                              }
                              className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold hover:bg-emerald-200 transition-colors"
                            >
                              Assign
                            </button>
                          )}
                        <button
                          onClick={() => {
                            setViewingItem(row);
                            setIsViewModalOpen(true);
                          }}
                          className="p-2 hover:bg-white hover:text-emerald-600 rounded-lg hover:shadow-sm transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openModal(row)}
                            className="p-2 hover:bg-white hover:text-blue-600 rounded-lg hover:shadow-sm transition-all"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteClick(row.id)}
                            className="p-2 hover:bg-white hover:text-red-600 rounded-lg hover:shadow-sm transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {processedData.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-12 text-gray-400"
                    >
                      No records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 backdrop-blur-sm animate-fade-in p-2 sm:p-3 md:p-0">
            <div className="bg-white w-full sm:w-[95%] max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-zoom-in md:w-full md:h-auto md:max-w-4xl border border-white/50">
              <div className="flex justify-between items-center p-6 border-b border-emerald-50 shrink-0 bg-emerald-50/30">
                <div>
                  <h3 className="text-2xl font-bold text-[#064e3b]">
                    {editingItem ? "Edit" : "Add New"}{" "}
                    {collectionName.slice(0, -1)}
                  </h3>
                  <p className="text-sm text-emerald-600/70 mt-1">
                    {userRole === UserRole.VENDOR &&
                    collectionName === "products" &&
                    editingItem
                      ? "Manage stock or request changes."
                      : "Fill in the details below to save."}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 pt-2 shrink-0 bg-white border-b border-emerald-50 overflow-x-auto">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab("basic")}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${
                      activeTab === "basic"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-gray-400 hover:text-emerald-600"
                    }`}
                  >
                    Basic Info
                  </button>
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${
                      activeTab === "details"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-gray-400 hover:text-emerald-600"
                    }`}
                  >
                    Details & Specs
                  </button>
                  <button
                    onClick={() => setActiveTab("extra")}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${
                      activeTab === "extra"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-gray-400 hover:text-emerald-600"
                    }`}
                  >
                    Docs & Custom
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
                {createdCredentials ? (
                  <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center max-w-sm mx-auto shadow-lg">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                      <CheckCircle size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      Account Created!
                    </h4>
                    <p className="text-gray-500 text-sm mb-6">
                      Credentials generated successfully.
                    </p>
                    <div className="bg-emerald-50 rounded-xl p-4 text-left space-y-3 mb-6">
                      <div>
                        <label className="text-xs font-bold text-emerald-600 uppercase">
                          Login
                        </label>
                        <div className="font-mono font-bold text-gray-800">
                          {createdCredentials.email}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-emerald-600 uppercase">
                          Password
                        </label>
                        <div className="font-mono font-bold text-gray-800">
                          {createdCredentials.password}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setCreatedCredentials(null);
                      }}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form
                    id="resourceForm"
                    onSubmit={handleSave}
                    className="space-y-8"
                  >
                    {activeTab === "basic" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {fields.map((field) => (
                            <div
                              key={field.key}
                              className={
                                field.type === "textarea" ? "md:col-span-2" : ""
                              }
                            >
                              {renderInput(
                                field.key,
                                field.label,
                                field.type,
                                "",
                                true,
                                field.options
                              )}
                            </div>
                          ))}
                        </div>
                        {collectionName === "vendors" && !editingItem && (
                          <div className="p-4 bg-white rounded-xl border border-emerald-100 flex items-center gap-3 shadow-sm">
                            <input
                              type="checkbox"
                              checked={createUserAccount}
                              onChange={(e) =>
                                setCreateUserAccount(e.target.checked)
                              }
                              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                            />
                            <div className="flex-1">
                              <label
                                className="text-sm font-bold text-gray-900 block cursor-pointer"
                                onClick={() =>
                                  setCreateUserAccount(!createUserAccount)
                                }
                              >
                                Create Login Account
                              </label>
                              <p className="text-xs text-gray-500">
                                Allow this vendor to access the dashboard.
                              </p>
                            </div>
                            {createUserAccount && (
                              <input
                                type="password"
                                value={userPassword}
                                onChange={(e) =>
                                  setUserPassword(e.target.value)
                                }
                                placeholder="Password"
                                className="h-10 px-3 border border-emerald-100 rounded-lg text-sm w-48 outline-none focus:border-emerald-500"
                              />
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {activeTab === "details" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {collectionName === "products" && (
                          <>
                            <div className="col-span-2 md:col-span-1">
                              {renderInput(
                                "sku",
                                "Stock Keeping Unit (SKU)",
                                "text",
                                "SKU-000"
                              )}
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              {renderInput(
                                "barcode",
                                "Barcode Number",
                                "text",
                                "EAN-13 / UPC"
                              )}
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              {renderInput(
                                "costPrice",
                                "Cost Price",
                                "number",
                                "0.00"
                              )}
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              {renderInput(
                                "brand",
                                "Brand / Manufacturer",
                                "text",
                                "Brand Name"
                              )}
                            </div>
                          </>
                        )}
                        <div className="col-span-full">
                          {renderInput(
                            "description",
                            "Detailed Description",
                            "textarea",
                            "Enter full details here..."
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === "extra" && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm text-center">
                          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                            <Upload size={20} />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">
                            Upload Documents
                          </h4>
                          <p className="text-xs text-gray-500 mb-4">
                            PDF, JPG, or PNG files supported.
                          </p>
                          <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                            Choose File{" "}
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleDocUpload}
                            />
                          </label>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                              <Layers size={16} className="text-emerald-500" />{" "}
                              Custom Fields
                            </h4>
                            <button
                              type="button"
                              onClick={handleAddCustomField}
                              className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Field
                            </button>
                          </div>
                          {customFields.length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-2">
                              No custom fields added.
                            </p>
                          )}
                          {customFields.map((field, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                placeholder="Key"
                                value={field.key}
                                onChange={(e) => {
                                  const n = [...customFields];
                                  n[i].key = e.target.value;
                                  setCustomFields(n);
                                }}
                                className="flex-1 h-9 px-3 border border-gray-200 rounded-lg text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Value"
                                value={field.value}
                                onChange={(e) => {
                                  const n = [...customFields];
                                  n[i].value = e.target.value;
                                  setCustomFields(n);
                                }}
                                className="flex-1 h-9 px-3 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
              {!createdCredentials && (
                <div className="p-6 border-t border-emerald-50 bg-white flex justify-between gap-3 shrink-0">
                  {userRole === UserRole.VENDOR &&
                    collectionName === "products" &&
                    editingItem && (
                      <button
                        type="button"
                        onClick={() => setIsRequestChangeOpen(true)}
                        className="flex items-center gap-2 text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors"
                      >
                        <MessageSquare size={16} /> Request Changes
                      </button>
                    )}

                  <div className="flex gap-3 ml-auto">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      form="resourceForm"
                      type="submit"
                      disabled={isCreatingUser}
                      className="px-8 py-3 bg-[#064e3b] text-white rounded-xl font-bold shadow-xl shadow-emerald-900/20 hover:bg-emerald-900 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {editingItem ? "Save Updates" : "Create Entry"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {isViewModalOpen &&
        viewingItem &&
        createPortal(
          <ViewDetailsModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            data={viewingItem}
            type={collectionName.slice(0, -1) as any}
          />,
          document.body
        )}

      {isRequestChangeOpen && editingItem && (
        <RequestChangeModal
          isOpen={isRequestChangeOpen}
          onClose={() => setIsRequestChangeOpen(false)}
          targetId={editingItem.id}
          targetName={editingItem.name}
          collectionName={collectionName}
        />
      )}

      {/* IMPORT / EXPORT / ASSIGN DIALOGS */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        collectionName={collectionName}
        fields={fields}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={processedData} // Passes currently filtered and sorted data
        collectionName={collectionName}
        columns={displayColumns}
      />

      {assignDialogState.isOpen &&
        assignDialogState.source &&
        createPortal(
          <AssignDialog
            isOpen={assignDialogState.isOpen}
            onClose={() =>
              setAssignDialogState({ isOpen: false, source: null, type: null })
            }
            sourceId={assignDialogState.source.id}
            sourceName={assignDialogState.source.name}
            type={assignDialogState.type}
          />,
          document.body
        )}

      {isBulkAssignOpen && (
        <BulkAssignDialog
          isOpen={isBulkAssignOpen}
          onClose={() => setIsBulkAssignOpen(false)}
          selectedProductIds={data.slice(0, 5).map((d) => d.id)}
          targetType="VENDOR"
        />
      )}
      {isDeleteModalOpen &&
        createPortal(
          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            title="Delete Item"
            message="Are you sure you want to remove this item? This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setIsDeleteModalOpen(false)}
            confirmText="Delete"
            isDestructive={true}
          />,
          document.body
        )}
    </div>
  );
};

export default ResourceManager;
