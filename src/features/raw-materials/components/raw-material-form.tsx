"use client";

import { Form, Input, InputNumber, Select, Button, Card } from "antd";
import { useToast } from "@/components/ui/toast";
import { createRawMaterial, updateRawMaterial } from "../actions";
import type { RawMaterialFormData } from "../types";

const unitOptions = [
  { label: "Pcs", value: "pcs" },
  { label: "Kg", value: "kg" },
  { label: "Gram", value: "gram" },
  { label: "Liter", value: "liter" },
  { label: "Ml", value: "ml" },
  { label: "Meter", value: "meter" },
  { label: "Box", value: "box" },
  { label: "Pack", value: "pack" },
  { label: "Sak", value: "sak" },
  { label: "Dus", value: "dus" },
];

export function RawMaterialForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: RawMaterialFormData & { id?: string } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const [form] = Form.useForm();
  const isEdit = !!initial?.id;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, v === null || v === undefined ? "" : String(v)));

    const res = isEdit
      ? await updateRawMaterial(initial!.id!, fd)
      : await createRawMaterial(fd);

    if (res.success) {
      toast.success(isEdit ? "Bahan baku diupdate" : "Bahan baku dibuat");
      onSuccess?.();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initial ? { ...initial, category: initial.category ?? undefined } : { unit: "pcs", minStock: 0, isActive: true }}
      onFinish={handleSubmit}
    >
      <Form.Item name="name" label="Nama Bahan Baku" rules={[{ required: true, message: "Wajib diisi" }]}>
        <Input placeholder="Nama bahan baku" />
      </Form.Item>
      <Form.Item name="sku" label="SKU" rules={[{ required: true, message: "Wajib diisi" }]}>
        <Input placeholder="Kode unik" />
      </Form.Item>
      <Form.Item name="category" label="Kategori">
        <Input placeholder="Misal: Bumbu, Tepung, Minuman" />
      </Form.Item>
      <Form.Item name="unit" label="Satuan" rules={[{ required: true, message: "Wajib diisi" }]}>
        <Select options={unitOptions} />
      </Form.Item>
      <Form.Item name="minStock" label="Min. Stok (peringatan)">
        <InputNumber className="w-full" min={0} placeholder="0" />
      </Form.Item>
      <Form.Item name="buyPrice" label="Harga Beli Rata-rata">
        <InputNumber className="w-full" min={0} prefix="Rp" placeholder="0" />
      </Form.Item>
      <div className="flex gap-2 justify-end mt-6">
        <Button onClick={onCancel}>Batal</Button>
        <Button type="primary" htmlType="submit">Simpan</Button>
      </div>
    </Form>
  );
}
