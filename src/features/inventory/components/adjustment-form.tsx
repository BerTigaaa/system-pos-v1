"use client";

import { useEffect, useState, useCallback } from "react";
import { Form, Input, InputNumber, Select, Button, Card } from "antd";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { adjustStock, getMovements } from "../actions";
import { getPosProducts } from "@/features/pos/actions";
import type { PosProduct } from "@/features/pos/store";

const typeOptions = [
  { label: "Pembelian (Masuk)", value: "PURCHASE" },
  { label: "Manual Keluar", value: "MANUAL_OUT" },
  { label: "Penyesuaian", value: "ADJUSTMENT" },
  { label: "Retur (Masuk)", value: "RETURN" },
];

export function AdjustmentForm() {
  const toast = useToast();
  const { can } = usePermissions();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<PosProduct[]>([]);

  const loadProducts = useCallback(async () => {
    const res = await getPosProducts({ pageSize: 200 });
    if (res.success) setProducts(res.data as PosProduct[]);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, String(v ?? "")));
    const res = await adjustStock(fd);
    if (res.success) {
      toast.success("Stok disesuaikan");
      form.resetFields();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
    setSubmitting(false);
  };

  if (!can("inventory", "manage")) {
    return <Card className="!border-0 !shadow-sm"><p className="text-gray-400 text-sm">Anda tidak memiliki izin untuk menyesuaikan stok.</p></Card>;
  }

  return (
    <Card className="!border-0 !shadow-sm" title="Penyesuaian Stok">
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="max-w-md">
        <Form.Item name="productId" label="Produk" rules={[{ required: true, message: "Pilih produk" }]}>
          <Select
            showSearch
            placeholder="Cari produk..."
            filterOption={(input, option) =>
              (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={products.map((p) => ({
              label: `${p.name} (${p.sku}) - Stok: ${p.stock}`,
              value: p.id,
            }))}
          />
        </Form.Item>
        <Form.Item name="type" label="Tipe" rules={[{ required: true, message: "Pilih tipe" }]}>
          <Select options={typeOptions} />
        </Form.Item>
        <Form.Item name="quantity" label="Jumlah" rules={[{ required: true, message: "Masukkan jumlah" }]}>
          <InputNumber className="w-full" min={1} placeholder="1" />
        </Form.Item>
        <Form.Item name="reason" label="Alasan">
          <Input placeholder="Alasan penyesuaian" />
        </Form.Item>
        <Form.Item name="notes" label="Catatan">
          <Input.TextArea rows={2} placeholder="Catatan tambahan" />
        </Form.Item>
        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Simpan
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
