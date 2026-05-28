"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input, Button, Spin, Tag, Badge } from "antd";
import {
  SearchOutlined, MinusOutlined, PlusOutlined, ShoppingCartOutlined,
  CheckCircleOutlined, ArrowLeftOutlined, OrderedListOutlined,
  EditOutlined, CoffeeOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import { createOrder, getOrderProducts, getTableOrders, updateOrderItems } from "@/features/orders/actions";

type PosProduct = {
  id: string; name: string; sku: string; sellPrice: number; stock: number; unit: string; imageUrl: string | null;
};

type CartItem = { productId: string; name: string; sellPrice: number; quantity: number };

type OrderData = {
  id: string; tableNumber: number; customerName: string; notes: string | null;
  status: string; total: number; createdAt: Date;
  items: { id: string; productId: string; productName: string; quantity: number; sellPrice: number; subtotal: number }[];
};

export function OrderPageClient({ tableNumber, businessName }: { tableNumber: number; businessName: string; logoUrl: string | null }) {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // mode: "menu" | "orders"
  const [view, setView] = useState<"menu" | "orders">("menu");

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.sellPrice * i.quantity, 0);

  const [savedName, setSavedName] = useState("");
  const hasSeenOrders = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("self_order_name");
    if (stored) setSavedName(stored);
  }, []);

  useEffect(() => {
    if (savedName) {
      setCustomerName(savedName);
      setView("orders");
    }
  }, [savedName]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getOrderProducts({ search });
    if (res.success) setProducts(res.data as PosProduct[]);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const loadOrders = useCallback(async () => {
    const name = customerName || savedName;
    if (!name) return;
    setLoadingOrders(true);
    const res = await getTableOrders(tableNumber, name);
    if (res.success) {
      if (res.data.length > 0) hasSeenOrders.current = true;
      if (res.data.length === 0 && hasSeenOrders.current) {
        localStorage.removeItem("self_order_name");
        setSavedName("");
        setCustomerName("");
        setView("menu");
        setOrders([]);
        hasSeenOrders.current = false;
        setLoadingOrders(false);
        return;
      }
      setOrders(res.data);
    }
    setLoadingOrders(false);
  }, [tableNumber, customerName, savedName]);

  useEffect(() => {
    if (view === "orders" && (customerName || savedName)) loadOrders();
  }, [view, loadOrders, customerName, savedName]);

  // Refresh orders when tab becomes visible (payment done by cashier)
  useEffect(() => {
    if (view !== "orders" || !(customerName || savedName)) return;
    const handler = () => {
      if (document.visibilityState === "visible") loadOrders();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [view, customerName, savedName, loadOrders]);

  const addToCart = (p: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, sellPrice: p.sellPrice, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("tableNumber", String(tableNumber));
    fd.set("customerName", customerName);
    if (notes) fd.set("notes", notes);
    for (const item of cart) {
      fd.append("items", JSON.stringify({ productId: item.productId, quantity: item.quantity, sellPrice: item.sellPrice }));
    }
    const res = await createOrder(fd);
    setSubmitting(false);
    if (res.success) {
      localStorage.setItem("self_order_name", customerName);
      setSavedName(customerName);
      setCart([]);
      setNotes("");
      setShowCart(false);
      setEditingOrderId(null);
      setView("orders");
      loadOrders();
    } else {
      alert(res.error?.message ?? "Gagal memesan");
    }
  };

  const handleEditOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setCart(order.items.map((i) => ({
      productId: i.productId,
      name: i.productName,
      sellPrice: i.sellPrice,
      quantity: i.quantity,
    })));
    setEditingOrderId(orderId);
    setShowCart(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOrderId) return;
    setSubmitting(true);
    const items = cart.map((i) => ({ productId: i.productId, quantity: i.quantity, sellPrice: i.sellPrice }));
    const res = await updateOrderItems(editingOrderId, items);
    setSubmitting(false);
    if (res.success) {
      setCart([]);
      setShowCart(false);
      setEditingOrderId(null);
      loadOrders();
    } else {
      alert(res.error?.message ?? "Gagal mengubah pesanan");
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setEditingOrderId(null);
    setNotes("");
    setView("menu");
  };

  const handleLogout = () => {
    localStorage.removeItem("self_order_name");
    setSavedName("");
    setCustomerName("");
    setOrders([]);
    setView("menu");
  };

  const statusBadge = (status: string) => {
    if (status === "PENDING") return <Badge status="processing" text={<span className="text-xs text-orange-500">Menunggu</span>} />;
    if (status === "CONFIRMED") return <Badge status="warning" text={<span className="text-xs text-amber-600">Dimasak</span>} />;
    if (status === "COMPLETED") return <Badge status="success" text={<span className="text-xs text-green-600">Selesai</span>} />;
    return null;
  };

  const ordersTotal = orders.reduce((s, o) => s + o.total, 0);
  const allItemsCount = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);

  // ===== RENDER =====
  if (view === "orders" && (customerName || savedName)) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col">
        <header className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-20 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {businessName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{businessName}</p>
            <p className="text-xs text-gray-400">Meja {tableNumber} — {customerName || savedName}</p>
          </div>
          {orders.length === 0 && (
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500">Ganti Nama</button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loadingOrders ? (
            <div className="flex justify-center py-16"><Spin /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <OrderedListOutlined className="text-5xl text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 mb-4">Belum ada pesanan</p>
              <Button type="primary" size="large" onClick={handleNewOrder} className="!rounded-full !px-8">
                Mulai Pesan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        #{o.createdAt ? new Date(o.createdAt).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </span>
                      {statusBadge(o.status)}
                    </div>
                    <span className="text-xs font-bold text-gray-900">Rp {o.total.toLocaleString("id")}</span>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {o.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.productName} x{item.quantity}</span>
                        <span className="text-gray-500">Rp {item.subtotal.toLocaleString("id")}</span>
                      </div>
                    ))}
                  </div>
                  {o.notes && (
                    <div className="px-4 pb-2">
                      <span className="text-[11px] text-gray-400 italic">Catatan: {o.notes}</span>
                    </div>
                  )}
                  {o.status === "PENDING" && (
                    <div className="px-4 pb-3">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditOrder(o.id)}
                        className="!text-xs !rounded-full"
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {orders.length > 1 && (
                <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700">Total Semua Pesanan</span>
                  <span className="text-base font-bold text-blue-700">Rp {ordersTotal.toLocaleString("id")}</span>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                ghost
                icon={<CoffeeOutlined />}
                onClick={handleNewOrder}
                className="!rounded-xl !h-12 !mt-2"
              >
                Tambah Pesanan Lagi
              </Button>
            </div>
          )}
        </div>

        {/* CART SHEET (for edit mode) */}
        {showCart && (
          <CartSheet
            cart={cart}
            cartCount={cartCount}
            total={total}
            setShowCart={setShowCart}
            updateQty={updateQty}
            submitting={submitting}
            editingOrderId={editingOrderId}
            handleSubmit={editingOrderId ? handleSaveEdit : handleSubmit}
            customerName={customerName}
            setCustomerName={setCustomerName}
            notes={notes}
            setNotes={setNotes}
            savedName={savedName}
          />
        )}
      </div>
    );
  }

  // ===== MENU VIEW =====
  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <header className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-20 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {businessName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{businessName}</p>
          <p className="text-xs text-gray-400">Meja {tableNumber}</p>
        </div>
        {savedName && (
          <button onClick={() => setView("orders")} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
            <OrderedListOutlined /> Pesanan
          </button>
        )}
        <button
          onClick={() => setShowCart(true)}
          className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ShoppingCartOutlined className="text-lg text-gray-600" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      <div className="px-4 pt-3 pb-1">
        <Input
          prefix={<SearchOutlined className="text-gray-300" />}
          placeholder="Cari menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="large"
          variant="outlined"
          className="!rounded-xl"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-20"><Spin size="large" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">Menu tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="text-left rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-blue-200 hover:shadow-md active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-5xl font-bold text-gray-200">{p.name.charAt(0)}</span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight min-h-[2.5em]">{p.name}</p>
                  <p className="text-sm font-bold text-blue-600">Rp {p.sellPrice.toLocaleString("id")}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CART BOTTOM SHEET */}
      {showCart && (
        <CartSheet
          cart={cart}
          cartCount={cartCount}
          total={total}
          setShowCart={setShowCart}
          updateQty={updateQty}
          submitting={submitting}
          editingOrderId={editingOrderId}
          handleSubmit={editingOrderId ? handleSaveEdit : handleSubmit}
          customerName={customerName}
          setCustomerName={setCustomerName}
          notes={notes}
          setNotes={setNotes}
          savedName={savedName}
        />
      )}

      {/* FLOATING CART BUTTON */}
      {cart.length > 0 && !showCart && (
        <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between bg-gray-900 text-white rounded-2xl px-5 py-4 shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCartOutlined className="text-lg" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-white text-gray-900 text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="text-sm font-medium">Lihat Pesanan</span>
            </div>
            <span className="text-sm font-bold">Rp {total.toLocaleString("id")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function CartSheet({
  cart, cartCount, total, setShowCart, updateQty, submitting, editingOrderId,
  handleSubmit, customerName, setCustomerName, notes, setNotes, savedName,
}: {
  cart: CartItem[]; cartCount: number; total: number;
  setShowCart: (v: boolean) => void; updateQty: (id: string, d: number) => void;
  submitting: boolean; editingOrderId: string | null;
  handleSubmit: () => void;
  customerName: string; setCustomerName: (v: string) => void; notes: string; setNotes: (v: string) => void;
  savedName: string;
}) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col">
      <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
      <div className="relative mt-auto bg-white rounded-t-2xl shadow-xl max-h-[80dvh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-base text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              {editingOrderId ? "Edit Pesanan" : "Pesanan Saya"}
            </span>
            <span className="text-xs text-gray-400">({cartCount} item)</span>
          </div>
          <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeftOutlined />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Belum ada item</p>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Rp {(item.sellPrice * item.quantity).toLocaleString("id")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQty(item.productId, -1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-300 hover:text-blue-500 active:bg-blue-50 transition-all"
                  >
                    <MinusOutlined className="text-xs" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, 1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-300 hover:text-blue-500 active:bg-blue-50 transition-all"
                  >
                    <PlusOutlined className="text-xs" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-white rounded-b-2xl">
            {!editingOrderId && !savedName && (
              <Input
                placeholder="Nama pemesan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                size="middle"
                className="!rounded-xl"
              />
            )}
            <Input
              placeholder="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="middle"
              className="!rounded-xl"
            />
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900">Rp {total.toLocaleString("id")}</p>
              </div>
              <Button
                type="primary"
                size="large"
                loading={submitting}
                disabled={!customerName.trim() && !savedName}
                onClick={handleSubmit}
                className="!rounded-full !px-8 !h-11"
              >
                {editingOrderId ? "Simpan Perubahan" : "Pesan"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
