"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Tooltip, Select, InputNumber } from "antd";
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { useCartStore } from "../store";
import { getPosCustomers } from "../actions";
import { CheckoutModal } from "./checkout-modal";
import { ReceiptModal } from "./receipt-modal";
import type { Customer } from "@prisma/client";

export function CartPanel() {
  const { items, customerId, discountPercent, removeItem, updateQuantity, setCustomer, setDiscountPercent, clearCart } = useCartStore();
  const [customers, setCustomers] = useState<Pick<Customer, "id" | "name" | "phone">[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ id: string; invoiceNumber: string } | null>(null);

  const subtotal = items.reduce((s, i) => s + i.sellPrice * i.quantity, 0);
  const discAmount = discountPercent > 0 ? subtotal * (discountPercent / 100) : 0;
  const total = subtotal - discAmount;

  const loadCustomers = useCallback(async (q: string) => {
    const res = await getPosCustomers(q);
    if (res.success) setCustomers(res.data as Pick<Customer, "id" | "name" | "phone">[]);
  }, []);

  useEffect(() => { loadCustomers(""); }, [loadCustomers]);

  const handleCheckoutSuccess = (data: { id: string; invoiceNumber: string }) => {
    setCheckoutOpen(false);
    setReceiptData(data);
    clearCart();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-500">
            <ShoppingCartOutlined className="text-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Keranjang</span>
          {items.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 tabular-nums">{items.length} item</span>
          )}
        </div>
        <Select
          showSearch
          placeholder="Cari pelanggan..."
          style={{ width: "100%" }}
          size="small"
          value={customerId}
          onChange={(id) => setCustomer(id, null)}
          onSearch={(v) => loadCustomers(v)}
          filterOption={false}
          onFocus={() => loadCustomers("")}
          notFoundContent={null}
          allowClear
          options={customers.map((c) => ({
            label: `${c.name} — ${c.phone}`,
            value: c.id,
          }))}
          className="customer-select"
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
        <div className="flex items-center gap-2.5">
          <PercentageOutlined className="text-gray-300 text-xs" />
          <InputNumber
            size="small"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(v) => setDiscountPercent(v ?? 0)}
            formatter={(v) => `${v ?? 0}%`}
            className="flex-1"
            variant="borderless"
            style={{ background: "#f5f5f5" }}
            placeholder="Diskon"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal</span>
            <span className="tabular-nums">Rp {subtotal.toLocaleString("id")}</span>
          </div>
          {discAmount > 0 && (
            <div className="flex justify-between text-xs text-red-400">
              <span>Diskon {discountPercent}%</span>
              <span className="tabular-nums">-Rp {discAmount.toLocaleString("id")}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
            <span>Total</span>
            <span className="tabular-nums">Rp {total.toLocaleString("id")}</span>
          </div>
        </div>

        <Button
          type="primary"
          size="large"
          block
          disabled={items.length === 0}
          onClick={() => setCheckoutOpen(true)}
          className="!h-11 !rounded-xl !text-sm !font-semibold !shadow-lg !shadow-blue-500/20 hover:!shadow-blue-500/30 !transition-shadow"
        >
          Bayar Rp {total.toLocaleString("id")}
        </Button>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      <ReceiptModal
        data={receiptData}
        onClose={() => setReceiptData(null)}
      />
    </div>
  );
}
