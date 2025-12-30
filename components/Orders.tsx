import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  where,
  getDocs,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { UserRole, Order, OrderItem, Product, Shop } from "../types";
import {
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  ArrowUpRight,
  WifiOff,
  Download,
  Filter,
  ShoppingCart,
  Lock,
  Printer,
  Search,
  Trash2,
  ArrowLeft,
  CreditCard,
  Package,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Store,
  Minus,
  Banknote,
  Edit,
  Eye,
  X,
  MapPin,
  Calendar,
  User,
  Clock,
  Layers,
} from "lucide-react";
import { MOCK_PRODUCTS, CATEGORIES_DATA } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import ExportModal from "./ExportModal";
import { logActivity } from "../utils/logger";
import FilterBar from "./FilterBar";
import { createPortal } from "react-dom";

interface OrdersProps {
  userRole: UserRole | null;
}

const Orders: React.FC<OrdersProps> = ({ userRole }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"LIST" | "CREATE">("LIST");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  // Admin: Selected Order for Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Vendor: Create Order State
  const [selectedCategory, setSelectedCategory] = useState<string>("FOODS");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Vendor: Shop Selection
  const [assignedShops, setAssignedShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");

  // Load Cart
  useEffect(() => {
    const savedCart = localStorage.getItem("tros_vendor_cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("tros_vendor_cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch Data (Shops for Vendor, Orders)
  useEffect(() => {
    let unsubscribeOrders = () => {};
    let unsubscribeShops = () => {};

    const initData = async () => {
      setLoading(true);
      try {
        if (userRole === UserRole.VENDOR && currentUser?.email) {
          // 1. Get Vendor Profile -> Shops
          const vendorQ = query(
            collection(db, "vendors"),
            where("email", "==", currentUser.email)
          );
          const vendorSnap = (await getDocs(
            vendorQ
          )) as QuerySnapshot<DocumentData>;

          if (!vendorSnap.empty) {
            const vendorId = vendorSnap.docs[0].id;
            // Shops
            const shopsQ = query(
              collection(db, "shops"),
              where("assignedVendorId", "==", vendorId)
            );
            unsubscribeShops = onSnapshot(
              shopsQ,
              (snap: QuerySnapshot<DocumentData>) => {
                const myShops = snap.docs.map(
                  (d) => ({ id: d.id, ...d.data() } as Shop)
                );
                setAssignedShops(myShops);
                if (myShops.length > 0 && !selectedShopId)
                  setSelectedShopId(myShops[0].id);

                // Orders for these shops
                const shopIds = myShops.map((s) => s.id);
                if (shopIds.length > 0) {
                  const ordersQ = query(
                    collection(db, "orders"),
                    where("shopId", "in", shopIds.slice(0, 10))
                  );
                  unsubscribeOrders = onSnapshot(
                    ordersQ,
                    (oSnap: QuerySnapshot<DocumentData>) => {
                      const fetched = oSnap.docs.map(
                        (d) => ({ id: d.id, ...d.data() } as Order)
                      );
                      setOrders(fetched);
                      setLoading(false);
                    }
                  );
                } else {
                  setOrders([]);
                  setLoading(false);
                }
              }
            );
          } else {
            setLoading(false); // No vendor profile found
          }
        } else {
          // Admin View
          const q = query(collection(db, "orders"));
          unsubscribeOrders = onSnapshot(
            q,
            (snap: QuerySnapshot<DocumentData>) => {
              setOrders(
                snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
              );
              setLoading(false);
            },
            (err) => {
              setLoading(false);
            }
          );
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    initData();
    return () => {
      unsubscribeOrders();
      unsubscribeShops();
    };
  }, [userRole, currentUser]);

  // Derived Data
  const processedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(lower) ||
          order.shop.toLowerCase().includes(lower) ||
          String(order.totalValue).includes(lower)
      );
    }

    // 2. Filters
    if (filters.status)
      result = result.filter((o) => o.status === filters.status);
    if (filters.shop) result = result.filter((o) => o.shop === filters.shop);

    // 3. Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";

      if (sortConfig.key === "totalValue") {
        return sortConfig.direction === "asc"
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [orders, searchTerm, filters, sortConfig]);

  // Real-time Active Order for Modal
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Hold":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Order["status"]) => {
    if (userRole !== UserRole.ADMIN) return;
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
      await logActivity(
        "ORDER",
        `Updated status ${id.slice(0, 6)} to ${newStatus}`,
        currentUser?.email || "Admin"
      );
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Failed to update status. Check console.");
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
        },
      ];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty, total: newQty * item.price };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !selectedShopId) return;
    setLoading(true);
    const totalVal = cart.reduce((sum, item) => sum + item.total, 0);
    const shopName =
      assignedShops.find((s) => s.id === selectedShopId)?.name || "Unknown";

    try {
      await addDoc(collection(db, "orders"), {
        vendorName: currentUser?.email,
        shop: shopName,
        shopId: selectedShopId,
        date: new Date().toISOString().split("T")[0],
        totalItems: cart.reduce((s, i) => s + i.quantity, 0),
        totalValue: totalVal,
        status: "Pending",
        items: cart,
        createdAt: new Date().toISOString(),
      });
      await logActivity(
        "ORDER",
        `New Order $${totalVal} for ${shopName}`,
        currentUser?.email || "Vendor"
      );
      setCart([]);
      setIsMobileCartOpen(false);
      setView("LIST");
    } catch (e) {
      alert("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  // --- Invoice / Modal Render ---

  const OrderDetailsModal = () => {
    if (!activeOrder) return null;
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-emerald-950/40 backdrop-blur-sm animate-fade-in p-2 sm:p-3 md:p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:z-[9999]">
        <div className="bg-white w-[95%] max-h-[90vh] md:max-w-4xl max-h-[55vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-white/50 print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none print:max-h-full print:h-full">
          {/* Header Actions (Hidden on Print) */}
          <div className="flex justify-between items-center p-6 border-b border-emerald-50 shrink-0 bg-emerald-50/30 print:hidden">
            <div>
              <h3 className="text-2xl font-bold text-[#064e3b]">
                Order Details
              </h3>
              <p className="text-sm text-emerald-600/70 mt-1">
                Review and print invoice.
              </p>
            </div>
            <button
              onClick={() => setSelectedOrderId(null)}
              className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Printable Invoice Area - ID USED BY CSS PRINT QUERY */}
          <div
            id="printable-area"
            className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 custom-scrollbar bg-[#f8fafc] print:bg-white print:overflow-visible"
          >
            {/* Invoice Header */}
            <div
              className="
    bg-white rounded-xl border border-emerald-100
    p-3 sm:p-4 md:p-8
    shadow-sm mb-6
    print:border-none print:shadow-none print:p-0
  "
            >
              <div className="flex flex-col gap-3 md:gap-6 md:flex-row md:justify-between md:items-start mb-4 md:mb-6 pb-4 md:pb-5 border-b border-emerald-100">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#064e3b] rounded-full flex items-center justify-center text-white font-bold text-base">
                      T
                    </div>
                    <div className="leading-tight">
                      <p className="text-base font-bold text-gray-900">
                        TROS One
                      </p>
                      <p className="text-xs text-gray-500">
                        Inventory Management System
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:text-right">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                    INVOICE
                  </h2>

                  <p className="text-sm font-mono text-[#064e3b] font-bold mt-1">
                    #{activeOrder.id.slice(0, 8).toUpperCase()}
                  </p>

                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(
                      activeOrder.status
                    )}`}
                  >
                    {activeOrder.status}
                  </span>
                </div>
              </div>

              {/* Bill To / From */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 mb-6 md:mb-8 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Bill To
                  </h4>
                  <p className="font-bold text-gray-900 text-lg">
                    {activeOrder.shop}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <User size={14} /> {activeOrder.vendorName}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Calendar size={14} /> {activeOrder.date}
                  </p>
                </div>
                <div className="md:text-right">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Payment Terms
                  </h4>
                  <p className="text-gray-800 font-medium">Due on Receipt</p>
                  <p className="text-gray-600 mt-1">
                    Please ensure payment is made
                    <br />
                    via bank transfer.
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8 rounded-lg border border-gray-200 overflow-x-auto -mx-2 sm:-mx-0">
                <table className="min-w-[640px] w-full text-sm text-left">
                  <thead className="bg-emerald-50 text-emerald-900 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="py-2 md:py-4 pl-4 md:pl-6">Description</th>
                      <th className="py-2 md:py-4 text-right">Quantity</th>
                      <th className="py-2 md:py-4 text-right">Unit Price</th>
                      <th className="py-2 md:py-4 pr-4 md:pr-6 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {activeOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 pl-4 md:pl-6 font-medium text-gray-900">
                          {item.productName}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 md:pr-6 text-right font-bold text-gray-900">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-10">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <span>${activeOrder.totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-200 text-xl font-bold text-[#064e3b]">
                    <span>Grand Total</span>
                    <span>${activeOrder.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details Footer */}
              <div
                className="
    bg-gray-50 border border-gray-200 rounded-xl
    p-3 sm:p-4 md:p-6
    flex flex-col md:flex-row
    gap-3 md:gap-6
    items-start
    print:bg-transparent print:border-t print:border-gray-200 print:rounded-none
  "
              >
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm print:hidden">
                  <Banknote size={24} className="text-[#064e3b]" />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Bank Name
                    </span>
                    <p className="font-medium text-gray-900">
                      TROS Corporate Bank
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Account Name
                    </span>
                    <p className="font-medium text-gray-900">
                      TROS One Holdings Ltd.
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Account Number
                    </span>
                    <p className="font-mono font-bold text-gray-900">
                      8829 3910 2039
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Routing / Sort Code
                    </span>
                    <p className="font-mono font-bold text-gray-900">
                      20-40-60
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-xs text-gray-400">
                <p>Thank you for your business.</p>
                <p>Questions? Contact support@tros.one</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          {/* <div className="p-6 border-t border-emerald-50 bg-white flex flex-col items-center md:flex-row md:justify-end gap-4 shrink-0 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-4 py-3 w-full max-w-[220px] md:w-auto
           bg-white border border-emerald-200 rounded-xl
           text-sm font-bold text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all"

            >
              <Printer size={18} /> Print Invoice
            </button>
            {userRole === UserRole.ADMIN && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:ml-4">
                <span className="text-sm font-medium text-gray-600">
                  Mark as:
                </span>
                <select
                  value={activeOrder.status}
                  onChange={(e) =>
                    handleUpdateStatus(activeOrder.id, e.target.value as any)
                  }
                  className="h-11 px-4 rounded-xl border border-gray-300 text-sm focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] outline-none bg-white font-bold"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Hold">Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}
          </div> */}

          <div
            className="p-6 border-t border-emerald-50 bg-white
                flex items-center justify-end gap-4
                shrink-0 print:hidden"
          >
            {/* Print Invoice */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2
               px-2 py-3
               bg-white border border-emerald-200 rounded-xl
               text-sm font-bold text-emerald-700
               hover:bg-emerald-50 shadow-sm transition-all"
            >
              <Printer size={18} />
              Print Invoice
            </button>

            {/* Status Dropdown */}
            {userRole === UserRole.ADMIN && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  Mark as:
                </span>
                <select
                  value={activeOrder.status}
                  onChange={(e) =>
                    handleUpdateStatus(activeOrder.id, e.target.value as any)
                  }
                  className="h-11 px-4 rounded-xl
                   border border-gray-300
                   text-sm font-bold
                   bg-white
                   focus:border-[#064e3b]
                   focus:ring-1 focus:ring-[#064e3b]
                   outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Hold">Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // --- Cart Component (Reusable) ---
  const CartContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur shrink-0">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <ShoppingCart size={20} className="text-[#064e3b]" /> Current Order
        </h3>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileCartOpen(false)}
          className="md:hidden text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-5 bg-emerald-50 border-b border-emerald-100 shrink-0">
        <label className="text-xs font-bold text-emerald-800 block mb-2 uppercase tracking-wide">
          Select Store Location
        </label>
        <div className="relative">
          <Store
            size={16}
            className="absolute left-3 top-2.5 text-emerald-400"
          />
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
          >
            <option value="">-- Choose Shop --</option>
            {assignedShops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center">
            <ShoppingCart size={48} className="opacity-20 mb-2" />
            <p>Cart is empty</p>
            <p className="text-xs text-gray-300 mt-1">
              Add items from the left to get started
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-emerald-200 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500">
                  ${item.price.toFixed(2)} / unit
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-gray-100 rounded-lg">
                  <button
                    onClick={() => updateCartQuantity(item.productId, -1)}
                    className="p-1 hover:bg-gray-200 rounded-l-lg text-gray-600"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.productId, 1)}
                    className="p-1 hover:bg-gray-200 rounded-r-lg text-gray-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="font-bold text-[#064e3b] w-16 text-right">
                  ${item.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600 font-medium">Total Amount</span>
          <span className="text-2xl font-bold text-[#064e3b]">
            ${cart.reduce((s, i) => s + i.total, 0).toFixed(2)}
          </span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedShopId || cart.length === 0}
          className="w-full py-3.5 bg-[#064e3b] text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-200 hover:brightness-110 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <CheckCircle size={20} />
          )}
          Confirm Order
        </button>
      </div>
    </div>
  );

  // --- Main Render ---

  if (view === "CREATE") {
    const filteredProducts = MOCK_PRODUCTS.filter((p) =>
      selectedCategory === "All"
        ? true
        : p.category.toUpperCase().includes(selectedCategory.split(" ")[0])
    );

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4 px-2 md:px-0">
          <button
            onClick={() => setView("LIST")}
            className="flex items-center text-gray-500 hover:text-[#064e3b] text-sm font-bold transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Orders
          </button>

          {/* Mobile Cart Toggle */}
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="md:hidden px-4 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:brightness-110"
          >
            <ShoppingCart size={16} /> View Cart (
            {cart.reduce((s, i) => s + i.quantity, 0)})
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden gap-6">
          {/* Products Column */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar bg-gray-50 shrink-0">
              {["FOODS", "BEVERAGES", "GROCERY"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === c
                      ? "bg-[#064e3b] text-white shadow"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center p-4 border-b border-gray-50 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      <Package size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        ${p.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* If item is in cart, show quantity controls inside list too, or just add button? Let's keep ADD button for simplicity, quantity in sidebar */}
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="px-4 py-1.5 bg-white text-[#064e3b] rounded-lg text-xs font-bold border border-[#064e3b] hover:bg-[#064e3b] hover:text-white transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Cart Sidebar */}
          <div className="hidden md:flex w-96 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CartContent />
          </div>
        </div>

        {/* Mobile Cart Drawer */}
        {isMobileCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:hidden p-0 animate-fade-in">
            <div className="bg-white w-full h-[70vh] rounded-t-2xl flex flex-col animate-slide-up overflow-hidden">
              <CartContent />
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW - Styled to match Inventory/ResourceManager
  return (
    <div className="space-y-3 md:space-y-6 pb-24 md:pb-0 pt-2 h-full flex flex-col">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          {/* <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-[#022c22]">
            Orders
          </h2> */}
          <p className="text-emerald-700/70 mt-1 font-medium">
            Manage and track your order fulfillments
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 md:flex-none h-11 px-6 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} /> Export
          </button>
          {userRole === UserRole.VENDOR && (
            <button
              onClick={() => setView("CREATE")}
              className="flex-1 md:flex-none h-11 px-6 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} /> New Order
            </button>
          )}
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["Pending", "In Progress", "Completed", "Hold"],
          },
          { key: "shop", label: "Shop Name", type: "text" },
        ]}
        filters={filters}
        onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        sortOptions={[
          { key: "date", label: "Date" },
          { key: "totalValue", label: "Value" },
          { key: "status", label: "Status" },
        ]}
        sortConfig={sortConfig}
        onSortChange={(key, direction) => setSortConfig({ key, direction })}
      />

      {/* COMPACT MOBILE INVOICE STRIPS */}
      <div className="block md:hidden space-y-4 pb-[calc(8rem+env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="text-center py-12 text-emerald-400 font-medium">
            Loading orders...
          </div>
        ) : (
          processedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden active:scale-98 transition-transform"
              onClick={() => setSelectedOrderId(order.id)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      <ShoppingCart size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">
                        Order #{order.id.slice(0, 5)}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">
                      Shop Location
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {order.shop}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">
                      Total Value
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      ${Number(order.totalValue).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-emerald-50 bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">
                  {order.totalItems} Items
                </span>
                <button className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  View Details <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
        {processedOrders.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-emerald-100">
            No records found.
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:flex flex-1 bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-emerald-500 font-medium">
            Loading data...
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#064e3b] text-white sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="h-14 px-6 font-bold tracking-wide whitespace-nowrap first:rounded-tl-lg">
                    Order ID
                  </th>
                  <th className="h-14 px-6 font-bold tracking-wide whitespace-nowrap">
                    Shop Name
                  </th>
                  <th className="h-14 px-6 font-bold tracking-wide whitespace-nowrap">
                    Date Created
                  </th>
                  <th className="h-14 px-6 font-bold tracking-wide whitespace-nowrap">
                    Total Value
                  </th>
                  <th className="h-14 px-6 font-bold tracking-wide whitespace-nowrap">
                    Status
                  </th>
                  <th className="h-14 px-6 text-right font-bold tracking-wide sticky right-0 bg-[#064e3b] shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.3)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {processedOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`group transition-all hover:bg-emerald-50/60 cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="p-4 px-6 font-mono text-[#064e3b] font-bold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 px-6 font-medium text-gray-800">
                      {order.shop}
                    </td>
                    <td className="p-4 px-6 text-gray-500">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 px-6 font-bold text-gray-900">
                      ${Number(order.totalValue).toFixed(2)}
                    </td>
                    <td className="p-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-right sticky right-0 bg-white group-hover:bg-emerald-50/60 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.02)] transition-colors">
                      <button className="p-2 hover:bg-white hover:text-emerald-600 rounded-lg hover:shadow-sm transition-all">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={orders}
        collectionName="orders"
        columns={[
          { key: "id", label: "ID" },
          { key: "shop", label: "Shop" },
          { key: "totalValue", label: "Total" },
        ]}
      />
      {activeOrder && <OrderDetailsModal />}
    </div>
  );
};

export default Orders;
