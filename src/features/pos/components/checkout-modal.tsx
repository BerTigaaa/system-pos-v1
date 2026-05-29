"use client";

import { useState, useMemo } from "react";
import { Modal, Form, InputNumber, Button, Radio } from "antd";
import { useToast } from "@/components/ui/toast";
import { WalletOutlined, BankOutlined, QrcodeOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useCartStore } from "../store";
import { checkout } from "../actions";

const paymentOptions = [
  { value: "CASH", label: "Tunai", icon: <WalletOutlined /> },
  { value: "QRIS", label: "QRIS", icon: <QrcodeOutlined /> },
  { value: "BANK_TRANSFER", label: "Transfer", icon: <BankOutlined /> },
  { value: "DEBIT_CARD", label: "Debit", icon: <CreditCardOutlined /> },
];

export function CheckoutModal({
  open,
  onClose,
  onSuccess,
  items: propItems,
  customerName: propCustomerName,
  tableNumber: propTableNumber,
  orderIds = [],
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: { id: string; invoiceNumber: string }) => void;
  items?: { productId: string; name: string; sku: string; quantity: number; sellPrice: number }[];
  customerName?: string;
  tableNumber?: number | null;
  orderIds?: string[];
}) {
  const storeItems = useCartStore((s) => s.items);
  const storeCustomerName = useCartStore((s) => s.customerName);
  const storePaymentMethod = useCartStore((s) => s.paymentMethod);
  const storeDiscount = useCartStore((s) => s.discountPercent);
  const storeTableNumber = useCartStore((s) => s.tableNumber);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);

  const items = propItems ?? storeItems;
  const customerName = propCustomerName ?? storeCustomerName;
  const currentTable = propTableNumber ?? storeTableNumber;
  const discountPercent = storeDiscount;
  const paymentMethod = storePaymentMethod;

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const paidAmount = Form.useWatch("paidAmount", form);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.sellPrice * i.quantity, 0), [items]);
  const discAmount = useMemo(() => (discountPercent > 0 ? subtotal * (discountPercent / 100) : 0), [discountPercent, subtotal]);
  const total = useMemo(() => subtotal - discAmount, [subtotal, discAmount]);
  const isCash = paymentMethod === "CASH";
  const change = isCash && paidAmount >= total ? paidAmount - total : 0;

  const handlePay = async () => {
    setSubmitting(true);

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        sellPrice: i.sellPrice,
        discountAmount: 0,
        name: i.name,
        sku: i.sku,
      })),
      customerName: customerName || undefined,
      discountPercent,
      payments: [
        {
          method: paymentMethod,
          amount: isCash ? (paidAmount ?? total) : total,
          changeAmount: change,
        },
      ],
      subtotal,
      totalDiscount: discAmount,
      total,
      tableNumber: currentTable,
      orderIds: orderIds,
    };

    const res = await checkout(payload);
    if (res.success) {
      toast.success(`Pembayaran berhasil — ${res.data!.invoiceNumber}`);
      onSuccess(res.data!);
    } else {
      toast.error(res?.error?.message ?? "Gagal memproses pembayaran");
    }
    setSubmitting(false);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-500">
            <WalletOutlined className="text-sm" />
          </div>
          <span className="text-sm font-semibold">Pembayaran</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      destroyOnHidden
    >
      <div className="space-y-5">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString("id")}</span>
            </div>
            {discAmount > 0 && (
              <div className="flex justify-between text-xs text-red-400">
                <span>Diskon {discountPercent}%</span>
                <span>-Rp {discAmount.toLocaleString("id")}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <span>Total</span>
              <span>Rp {total.toLocaleString("id")}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2.5">Metode Pembayaran</p>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full grid grid-cols-4 gap-2"
          >
            {paymentOptions.map((opt) => (
              <Radio.Button
                key={opt.value}
                value={opt.value}
                className="!h-auto !flex !flex-col !items-center !gap-1 !py-2.5 !px-1 !rounded-xl !border !border-gray-200 dark:!border-gray-700 [&.ant-radio-button-wrapper-checked]:!border-blue-500 [&.ant-radio-button-wrapper-checked]:!bg-blue-50 dark:[&.ant-radio-button-wrapper-checked]:!bg-blue-950 [&.ant-radio-button-wrapper-checked]:!text-blue-600 !text-[11px] !leading-tight !whitespace-normal"
              >
                <span className="text-base">{opt.icon}</span>
                {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>

        <Form form={form} layout="vertical" onFinish={handlePay}>
          {isCash && (
            <Form.Item
              name="paidAmount"
              label={<span className="text-xs font-medium text-gray-500">Jumlah Dibayar</span>}
              rules={[
                { required: true, message: "Masukkan jumlah dibayar" },
                {
                  validator: (_, v) =>
                    v >= total ? Promise.resolve() : Promise.reject(new Error("Kurang dari total")),
                },
              ]}
            >
              <InputNumber
                className="!w-full"
                min={total}
                prefix="Rp"
                placeholder="0"
                size="large"
                style={{ borderRadius: 10, width: "100%" }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              />
            </Form.Item>
          )}

          {isCash && change > 0 && (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl px-4 py-3 -mt-2 mb-4 flex items-center justify-between">
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Kembalian</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
                Rp {change.toLocaleString("id")}
              </span>
            </div>
          )}

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={submitting}
              className="!h-11 !rounded-xl !text-sm !font-semibold !shadow-lg !shadow-blue-500/20"
            >
              {isCash ? "Bayar Tunai" : `Bayar Rp ${total.toLocaleString("id")}`}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
