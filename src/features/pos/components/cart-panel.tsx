"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Tooltip, Select, InputNumber, Tag, Input, Segmented, Badge, Spin } from "antd";
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  PercentageOutlined,
  TableOutlined,
  UserOutlined,
  OrderedListOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useCartStore } from "../store";
import { getAvailableTables } from "@/features/settings/actions";
import { createPosOrder, getPosOrders, getCompletedOrdersByTable, getTablesWithCompletedOrders, updatePosOrderStatus, getPaidOrders } from "../actions";
import { CheckoutModal } from "./checkout-modal";
import { ReceiptModal } from "./receipt-modal";

type Mode = "order" | "pay" | "list" | "done";

type OrderItem = {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  sellPrice: number;
  subtotal: number;
};

type OrderData = {
  id: string;
  tableNumber: number;
  customerName: string;
  notes: string | null;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: Date;
};

export function CartPanel() {
  const { items, customerName, discountPercent, tableNumber, removeItem, updateQuantity, setCustomerName, setDiscountPercent, setTableNumber, clearCart } = useCartStore();
  const [mode, setMode] = useState<Mode>("order");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ id: string; invoiceNumber: string } | null>(null);
  const [tables, setTables] = useState<{ tableNumber: number; label: string; isAvailable: boolean }[]>([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  // Payment tab state
  const [payTables, setPayTables] = useState<{ tableNumber: number; label: string }[]>([]);
  const [selectedPayTable, setSelectedPayTable] = useState<number | null>(null);
  const [completedOrders, setCompletedOrders] = useState<OrderData[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [doneOrders, setDoneOrders] = useState<OrderData[]>([]);
  const [loadingDone, setLoadingDone] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.sellPrice * i.quantity, 0);
  const discAmount = discountPercent > 0 ? subtotal * (discountPercent / 100) : 0;
  const total = subtotal - discAmount;

  const loadTables = useCallback(async () => {
    const res = await getAvailableTables();
    if (res.success) setTables(res.data);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const res = await getPosOrders();
    if (res.success) setOrders(res.data);
    setLoadingOrders(false);
  }, []);

  const loadPayTables = useCallback(async () => {
    const res = await getTablesWithCompletedOrders();
    if (res.success) setPayTables(res.data);
  }, []);

  const loadDoneOrders = useCallback(async () => {
    setLoadingDone(true);
    const res = await getPaidOrders();
    if (res.success) setDoneOrders(res.data);
    setLoadingDone(false);
  }, []);

  const loadCompletedOrders = useCallback(async (tableNum: number) => {
    setLoadingCompleted(true);
    const res = await getCompletedOrdersByTable(tableNum);
    if (res.success) setCompletedOrders(res.data);
    setLoadingCompleted(false);
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  // Auto-refresh on mount
  useEffect(() => {
    if (mode === "list") loadOrders();
    if (mode === "pay") loadPayTables();
    if (mode === "done") loadDoneOrders();
  }, [mode, loadOrders, loadPayTables, loadDoneOrders]);

  useEffect(() => {
    if (selectedPayTable) loadCompletedOrders(selectedPayTable);
  }, [selectedPayTable, loadCompletedOrders]);

  const handleCreateOrder = async () => {
    if (!customerName.trim()) return;
    if (!tableNumber || tableNumber === -1) return;
    if (items.length === 0) return;

    setSubmittingOrder(true);
    const res = await createPosOrder({
      tableNumber,
      customerName: customerName.trim(),
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, sellPrice: i.sellPrice })),
    });
    setSubmittingOrder(false);

    if (res.success) {
      clearCart();
      setMode("list");
      loadOrders();
    }
  };

  const handleUpdateStatus = async (orderId: string, status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") => {
    await updatePosOrderStatus(orderId, status);
    loadOrders();
  };

  const handleCheckoutSuccess = (data: { id: string; invoiceNumber: string }) => {
    setCheckoutOpen(false);
    setReceiptData(data);
    setCompletedOrders([]);
    setSelectedPayTable(null);
    clearCart();
    loadPayTables();
  };

  // Build items + total from completed orders for payment
  const payItems = completedOrders.flatMap((o) =>
    o.items.map((i) => ({
      productId: i.productId ?? "",
      name: i.productName,
      sku: "",
      quantity: i.quantity,
      sellPrice: i.sellPrice,
      discountAmount: 0,
    }))
  );
  const payTotal = completedOrders.reduce((sum, o) => sum + o.total, 0);

  const statusBadge = (status: string) => {
    if (status === "PENDING") return <Badge status="processing" text={<span className="text-xs">Menunggu</span>} />;
    if (status === "CONFIRMED") return <Badge status="warning" text={<span className="text-xs">Dimasak</span>} />;
    if (status === "COMPLETED") return <Badge status="success" text={<span className="text-xs">Selesai</span>} />;
    return <Badge status="default" text={<span className="text-xs">{status}</span>} />;
  };

  const modeOptions = [
    { label: <span className="flex items-center gap-1.5 text-xs"><ShoppingCartOutlined />Pesan</span>, value: "order" },
    { label: <span className="flex items-center gap-1.5 text-xs"><DollarOutlined />Bayar</span>, value: "pay" },
    { label: <span className="flex items-center gap-1.5 text-xs"><OrderedListOutlined />Pesanan</span>, value: "list" },
    { label: <span className="flex items-center gap-1.5 text-xs"><CheckCircleOutlined />Selesai</span>, value: "done" },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <Segmented
          block
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={modeOptions}
          size="small"
        />
      </div>

      {/* ===== MODE: PESAN ===== */}
      {mode === "order" && (
        <div className="flex flex-col min-h-0 flex-1">
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 space-y-2.5">
            <Input
              placeholder="Nama pemesan"
              size="small"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              prefix={<UserOutlined className="text-gray-300" />}
              className="!rounded-lg"
            />

            <Select
              placeholder="Pilih meja"
              style={{ width: "100%" }}
              size="small"
              value={tableNumber}
              onChange={setTableNumber}
              allowClear
              notFoundContent={tables.length === 0 ? "Tidak ada meja tersedia" : null}
              onFocus={() => loadTables()}
              options={
                tables.length > 0
                  ? [
                      {
                        label: <span className="flex items-center gap-2"><TableOutlined /><span>Acak (Random)</span></span>,
                        value: -1,
                      },
                      ...tables.map((t) => ({
                        label: (
                          <span className="flex items-center gap-2">
                            <TableOutlined />
                            <span>{t.label || `Meja ${t.tableNumber}`}</span>
                            {!t.isAvailable && <Tag color="red" className="!text-[10px] !px-1 !py-0 !leading-none !m-0">Terisi</Tag>}
                          </span>
                        ),
                        value: t.tableNumber,
                        disabled: !t.isAvailable,
                      })),
                    ]
                  : []
              }
              className="table-select"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-200 dark:text-gray-700 gap-3">
                <ShoppingCartOutlined className="text-4xl" />
                <span className="text-xs text-gray-300 dark:text-gray-600">Belum ada item</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {items.map((item) => (
                  <div key={item.productId} className="px-4 py-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">Rp {item.sellPrice.toLocaleString("id")}</p>
                      </div>
                      <Tooltip title="Hapus">
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(item.productId)}
                          className="!w-6 !h-6 !min-w-0 -mt-0.5"
                        />
                      </Tooltip>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                          <MinusOutlined />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                          <PlusOutlined />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                        Rp {(item.quantity * item.sellPrice).toLocaleString("id")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="tabular-nums">Rp {subtotal.toLocaleString("id")}</span>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              disabled={items.length === 0 || !customerName.trim() || !tableNumber}
              loading={submittingOrder}
              onClick={handleCreateOrder}
              className="!h-11 !rounded-xl !text-sm !font-semibold !shadow-lg !shadow-blue-500/20 hover:!shadow-blue-500/30 !transition-shadow"
              icon={<CoffeeOutlined />}
            >
              Pesan
            </Button>
          </div>
        </div>
      )}

      {/* ===== MODE: BAYAR ===== */}
      {mode === "pay" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            <Select
              placeholder="Pilih meja dengan pesanan selesai"
              style={{ width: "100%" }}
              size="small"
              value={selectedPayTable}
              onChange={(v) => setSelectedPayTable(v)}
              allowClear
              options={payTables.map((t) => ({ label: t.label || `Meja ${t.tableNumber}`, value: t.tableNumber }))}
              className="table-select"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!selectedPayTable ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300 dark:text-gray-600 gap-3">
                <DollarOutlined className="text-4xl" />
                <span className="text-xs">Pilih meja untuk melihat pesanan selesai</span>
              </div>
            ) : loadingCompleted ? (
              <div className="flex justify-center py-12"><Spin /></div>
            ) : completedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-300 dark:text-gray-600 gap-2">
                <span className="text-xs">Tidak ada pesanan selesai di meja ini</span>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((o) => (
                  <div key={o.id} className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{o.customerName}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(o.createdAt).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {o.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-500">
                          <span>{item.productName} x{item.quantity}</span>
                          <span>Rp {item.subtotal.toLocaleString("id")}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                      <span>Subtotal</span>
                      <span>Rp {o.total.toLocaleString("id")}</span>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2">
                  <span>Total Semua Pesanan</span>
                  <span>Rp {payTotal.toLocaleString("id")}</span>
                </div>
              </div>
            )}
          </div>

          {selectedPayTable && completedOrders.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4">
              <Button
                type="primary"
                size="large"
                block
                onClick={() => setCheckoutOpen(true)}
                className="!h-11 !rounded-xl !text-sm !font-semibold !shadow-lg !shadow-blue-500/20 !bg-green-500 !border-green-500 hover:!bg-green-600 hover:!border-green-600"
                icon={<DollarOutlined />}
              >
                Bayar Rp {payTotal.toLocaleString("id")}
              </Button>
            </div>
          )}

          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={handleCheckoutSuccess}
            items={payItems}
            customerName={completedOrders[0]?.customerName ?? ""}
            tableNumber={selectedPayTable}
            orderIds={completedOrders.map(o => o.id)}
          />
        </div>
      )}

      {/* ===== MODE: DAFTAR PESANAN ===== */}
      {mode === "list" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{orders.length} pesanan</span>
            <Button size="small" type="text" onClick={loadOrders} icon={<ShoppingCartOutlined />} className="!text-xs">
              Refresh
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingOrders ? (
              <div className="flex justify-center py-12"><Spin /></div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300 dark:text-gray-600 gap-3">
                <OrderedListOutlined className="text-4xl" />
                <span className="text-xs">Belum ada pesanan</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {orders.map((o) => (
                  <div key={o.id} className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {tables.find((t) => t.tableNumber === o.tableNumber)?.label || `Meja ${o.tableNumber}`} — {o.customerName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(o.createdAt).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {statusBadge(o.status)}
                    </div>

                    <div className="space-y-0.5 mb-2">
                      {o.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-500">
                          <span>{item.productName} x{item.quantity}</span>
                          <span>Rp {item.subtotal.toLocaleString("id")}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-50 dark:border-gray-800">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Rp {o.total.toLocaleString("id")}
                      </span>
                      <div className="flex gap-1">
                        {o.status === "PENDING" && (
                          <>
                            <Button
                              size="small"
                              type="primary"
                              ghost
                              className="!text-[11px] !h-7 !px-2"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleUpdateStatus(o.id, "CONFIRMED")}
                            >
                              Konfirmasi
                            </Button>
                            <Button
                              size="small"
                              danger
                              type="text"
                              className="!text-[11px] !h-7 !px-2"
                              icon={<CloseCircleOutlined />}
                              onClick={() => handleUpdateStatus(o.id, "CANCELLED")}
                            >
                              Batal
                            </Button>
                          </>
                        )}
                        {o.status === "CONFIRMED" && (
                          <Button
                            size="small"
                            type="primary"
                            className="!text-[11px] !h-7 !px-2 !bg-green-500 !border-green-500"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleUpdateStatus(o.id, "COMPLETED")}
                          >
                            Antar
                          </Button>
                        )}
                        {o.status === "COMPLETED" && (
                          <Tag color="green" className="!text-[10px] !px-2 !py-0 !m-0">Selesai</Tag>
                        )}
                        {o.status === "CANCELLED" && (
                          <Tag color="red" className="!text-[10px] !px-2 !py-0 !m-0">Dibatalkan</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODE: SELESAI ===== */}
      {mode === "done" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{doneOrders.length} selesai</span>
            <Button size="small" type="text" onClick={loadDoneOrders} icon={<ShoppingCartOutlined />} className="!text-xs">
              Refresh
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingDone ? (
              <div className="flex justify-center py-12"><Spin /></div>
            ) : doneOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300 dark:text-gray-600 gap-3">
                <CheckCircleOutlined className="text-4xl" />
                <span className="text-xs">Belum ada pesanan selesai</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {doneOrders.map((o) => (
                  <div key={o.id} className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {tables.find((t) => t.tableNumber === o.tableNumber)?.label || `Meja ${o.tableNumber}`} — {o.customerName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(o.createdAt).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Tag color="green" className="!text-[10px] !px-2 !py-0 !m-0">Lunas</Tag>
                    </div>

                    <div className="space-y-0.5 mb-2">
                      {o.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-500">
                          <span>{item.productName} x{item.quantity}</span>
                          <span>Rp {item.subtotal.toLocaleString("id")}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-50 dark:border-gray-800">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Rp {o.total.toLocaleString("id")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ReceiptModal
        data={receiptData}
        onClose={() => setReceiptData(null)}
      />
    </div>
  );
}
