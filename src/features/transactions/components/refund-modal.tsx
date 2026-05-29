"use client";

import { useState } from "react";
import { Modal, Form, Input, Table, Button, InputNumber, Alert } from "antd";
import { useToast } from "@/components/ui/toast";
import { processRefund } from "../actions";

export function RefundModal({
  target,
  onClose,
  onSuccess,
}: {
  target: {
    transactionId: string;
    invoiceNumber: string;
    items: { id: string; productName: string; quantity: number; sellPrice: number; subtotal: number }[];
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [form] = Form.useForm();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const isFullRefund = selectedIds.length === target?.items.length;

  function resetState() {
    setSelectedIds([]);
    setQuantities({});
    form.resetFields();
  }

  async function handleSubmit() {
    if (!target || selectedIds.length === 0) {
      toast.error("Pilih minimal 1 item untuk direfund");
      return;
    }

    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const items = selectedIds.map((id) => {
      const item = target.items.find((i) => i.id === id)!;
      const qty = quantities[id] ?? item.quantity;
      return {
        transactionItemId: id,
        quantity: qty,
        amount: qty * item.sellPrice,
      };
    });

    setSubmitting(true);
    const res = await processRefund({
      transactionId: target.transactionId,
      items,
      reason: values.reason,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success(`Refund ${res.data.refundNumber} berhasil`);
      resetState();
      onSuccess();
    } else {
      toast.error(res.error?.message ?? "Refund gagal");
    }
  }

  function handleClose() {
    resetState();
    onClose();
  }

  const totalRefund = selectedIds.reduce((sum, id) => {
    const item = target?.items.find((i) => i.id === id);
    if (!item) return sum;
    const qty = quantities[id] ?? item.quantity;
    return sum + qty * item.sellPrice;
  }, 0);

  const columns = [
    {
      title: "Pilih",
      key: "select",
      width: 60,
      render: (_: unknown, record: { id: string }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...prev, record.id]);
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== record.id));
              setQuantities((prev) => {
                const next = { ...prev };
                delete next[record.id];
                return next;
              });
            }
          }}
        />
      ),
    },
    {
      title: "Produk",
      dataIndex: "productName",
      key: "productName",
    },
    {
      title: "Harga",
      dataIndex: "sellPrice",
      key: "sellPrice",
      width: 120,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    {
      title: "Terjual",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Jml Refund",
      key: "refundQty",
      width: 100,
      render: (_: unknown, record: { id: string; quantity: number }) => {
        if (!selectedIds.includes(record.id)) return "-";
        return (
          <InputNumber
            size="small"
            min={1}
            max={record.quantity}
            value={quantities[record.id] ?? record.quantity}
            onChange={(v) => setQuantities((prev) => ({ ...prev, [record.id]: v ?? record.quantity }))}
            className="!w-20"
          />
        );
      },
    },
    {
      title: "Subtotal",
      key: "subtotal",
      width: 130,
      align: "right" as const,
      render: (_: unknown, record: { id: string; sellPrice: number; quantity: number }) => {
        if (!selectedIds.includes(record.id)) return "-";
        const qty = quantities[record.id] ?? record.quantity;
        return `Rp ${(qty * record.sellPrice).toLocaleString("id")}`;
      },
    },
  ];

  return (
    <Modal
      title={`Refund — ${target?.invoiceNumber ?? ""}`}
      open={!!target}
      onCancel={handleClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={isFullRefund ? "Refund Semua" : "Refund Sebagian"}
      width={720}
    >
      {target && (
        <div className="space-y-4">
          <Alert
            type="info"
            title="Pilih item yang ingin direfund. Stok akan dikembalikan secara otomatis."
            showIcon
          />

          <Table
            dataSource={target.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />

          {selectedIds.length > 0 && (
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg">
              <span className="font-medium">Total Refund:</span>
              <span className="font-bold text-lg">Rp {totalRefund.toLocaleString("id")}</span>
            </div>
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              name="reason"
              label="Alasan Refund"
              rules={[{ required: true, message: "Alasan refund wajib diisi" }]}
            >
              <Input.TextArea rows={3} placeholder="Contoh: Pesanan tidak sesuai, produk rusak..." />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
}
