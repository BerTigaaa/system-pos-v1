"use client";

import { useEffect, useState, useCallback } from "react";
import { Form, Input, InputNumber, Select, Button, Card, DatePicker } from "antd";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { notifyInventoryUpdated } from "@/hooks/use-inventory-refresh";
import { stockIn, getAllRawMaterials } from "../actions";
import { getSuppliers } from "@/features/suppliers/actions";
import dayjs from "dayjs";
import type { SupplierItem } from "@/features/suppliers/types";

export function StockInForm() {
  const toast = useToast();
  const { can } = usePermissions();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<{ id: string; name: string; sku: string; stock: number; unit: string }[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);

  const load = useCallback(async () => {
    const [rmRes, supRes] = await Promise.all([getAllRawMaterials(), getSuppliers({ page: 1, pageSize: 200 })]);
    if (rmRes.success) setRawMaterials(rmRes.data);
    if (supRes.success) setSuppliers(supRes.data as SupplierItem[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v === null || v === undefined) fd.set(k, "");
      else if (k === "expiryDate" && v) fd.set(k, (v as dayjs.Dayjs).format("YYYY-MM-DD"));
      else fd.set(k, String(v));
    });
    const res = await stockIn(fd);
    if (res.success) {
      toast.success("Stok masuk berhasil");
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
    <Card className="!border-0 !shadow-sm" title="Stok Masuk (Pembelian)">
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
        <Form.Item name="batchCode" label="Kode Batch (opsional)">
          <Input placeholder="Misal: BATCH-001" />
        </Form.Item>
        <Form.Item name="quantity" label="Jumlah" rules={[{ required: true, message: "Masukkan jumlah" }]}>
          <InputNumber className="w-full" min={1} placeholder="1" />
        </Form.Item>
        <Form.Item name="buyPrice" label="Harga Beli (per satuan)">
          <InputNumber className="w-full" min={0} prefix="Rp" placeholder="0" />
        </Form.Item>
        <Form.Item name="expiryDate" label="Tanggal Kadaluwarsa (opsional)">
          <DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={(d) => d && d.isBefore(dayjs(), "day")} />
        </Form.Item>
        <Form.Item name="supplierId" label="Supplier (opsional)">
          <Select
            allowClear
            placeholder="Pilih supplier"
            options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
          />
        </Form.Item>
        <Form.Item name="notes" label="Catatan">
          <Input.TextArea rows={2} placeholder="Catatan tambahan" />
        </Form.Item>
        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Simpan Stok Masuk
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
