"use client";

import { useEffect, useState, useCallback } from "react";
import { Form, Input, InputNumber, Select, Button, Card } from "antd";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { notifyInventoryUpdated } from "@/hooks/use-inventory-refresh";
import { stockOut, getAllRawMaterials } from "../actions";

export function StockOutForm() {
  const toast = useToast();
  const { can } = usePermissions();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<{ id: string; name: string; sku: string; stock: number; unit: string }[]>([]);

  const load = useCallback(async () => {
    const res = await getAllRawMaterials();
    if (res.success) setRawMaterials(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, v === null || v === undefined ? "" : String(v)));
    const res = await stockOut(fd);
    if (res.success) {
      toast.success("Stok keluar berhasil");
      form.resetFields();
      notifyInventoryUpdated();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
    setSubmitting(false);
  };

  if (!can("inventory", "manage")) {
    return <Card className="!border-0 !shadow-sm"><p className="text-gray-400 text-sm">Anda tidak memiliki izin.</p></Card>;
  }

  return (
    <Card className="!border-0 !shadow-sm" title="Stok Keluar">
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="max-w-md">
        <Form.Item name="rawMaterialId" label="Bahan Baku" rules={[{ required: true, message: "Pilih bahan baku" }]}>
          <Select
            showSearch
            placeholder="Cari bahan baku..."
            filterOption={(input, option) =>
              (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={rawMaterials.map((rm) => ({
              label: `${rm.name} (${rm.sku}) - Stok: ${rm.stock} ${rm.unit}`,
              value: rm.id,
            }))}
          />
        </Form.Item>
        <Form.Item name="quantity" label="Jumlah" rules={[{ required: true, message: "Masukkan jumlah" }]}>
          <InputNumber className="w-full" min={1} placeholder="1" />
        </Form.Item>
        <Form.Item name="reason" label="Alasan">
          <Input placeholder="Misal: Produksi, Rusak, Kadaluwarsa" />
        </Form.Item>
        <Form.Item name="notes" label="Catatan">
          <Input.TextArea rows={2} placeholder="Catatan tambahan" />
        </Form.Item>
        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Simpan Stok Keluar
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
