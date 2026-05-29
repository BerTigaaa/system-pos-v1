"use client";

import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Select, Switch, Button, Image } from "antd";
import { createProduct, updateProduct, getCategories } from "../actions";

type Props = {
  initial?: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    categoryId: string | null;
    unit: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function ProductForm({ initial, onSuccess, onCancel }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [imagePreview, setImagePreview] = useState(initial?.imageUrl ?? null);

  useEffect(() => {
    getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    if (initial) form.setFieldsValue(initial);
    else {
      form.resetFields();
      form.setFieldValue("unit", "pcs");
      form.setFieldValue("minStock", 5);
      form.setFieldValue("stock", 0);
      form.setFieldValue("buyPrice", 0);
      form.setFieldValue("isActive", true);
    }
  }, [initial, form]);

  async function handleSubmit(values: Record<string, unknown>) {
    setLoading(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v ?? "")));

    const res = initial
      ? await updateProduct(initial.id, fd)
      : await createProduct(fd);

    setLoading(false);
    if (res.success) onSuccess();
    else form.setFields([{ name: "name", errors: [res.error?.message ?? "Gagal"] }]);
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
      <Form.Item name="name" label="Nama Produk" rules={[{ required: true, message: "Wajib diisi" }]}>
        <Input placeholder="Nama produk" />
      </Form.Item>
      <div className="flex gap-3">
        <Form.Item name="sku" label="SKU" className="flex-1" rules={[{ required: true, message: "Wajib diisi" }]}>
          <Input placeholder="Auto atau manual" />
        </Form.Item>
        <Form.Item name="barcode" label="Barcode" className="flex-1">
          <Input placeholder="Opsional" />
        </Form.Item>
      </div>
      <div className="flex gap-3">
        <Form.Item name="categoryId" label="Kategori" className="flex-1">
          <Select
            allowClear
            placeholder="Pilih kategori"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="unit" label="Satuan" className="flex-1" rules={[{ required: true, message: "Wajib diisi" }]}>
          <Select options={[{ value: "pcs", label: "Pcs" }, { value: "kg", label: "Kg" }, { value: "liter", label: "Liter" }, { value: "box", label: "Box" }]} />
        </Form.Item>
      </div>
      <Form.Item name="buyPrice" label="Harga Beli" rules={[{ required: true, message: "Wajib diisi" }]}>
        <InputNumber className="!w-full" min={0} prefix="Rp" />
      </Form.Item>
      <Form.Item name="sellPrice" label="Harga Jual" rules={[{ required: true, message: "Wajib diisi" }]}>
        <InputNumber className="!w-full" min={0} prefix="Rp" />
      </Form.Item>
      <div className="flex gap-3">
        <Form.Item name="stock" label="Stok Awal" className="flex-1">
          <InputNumber className="!w-full" min={0} />
        </Form.Item>
        <Form.Item name="minStock" label="Min. Stok" className="flex-1">
          <InputNumber className="!w-full" min={0} />
        </Form.Item>
      </div>
      <Form.Item name="description" label="Deskripsi">
        <Input.TextArea rows={2} placeholder="Opsional" />
      </Form.Item>
      <Form.Item name="imageUrl" label="URL Gambar">
        <Input
          placeholder="https://... (opsional)"
          onChange={(e) => setImagePreview(e.target.value || null)}
        />
      </Form.Item>
      {imagePreview && (
        <div className="mb-4">
          <Image src={imagePreview} alt="preview" width={120} height={120} style={{ objectFit: "cover", borderRadius: 8 }} fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGRjAwMDAiLz48dGV4dCB4PSI2MCIgeT0iNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE0Ij5JbWFnZTwvdGV4dD48L3N2Zz4=" />
        </div>
      )}
      <Form.Item name="isActive" label="Aktif" valuePropName="checked">
        <Switch />
      </Form.Item>
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel}>Batal</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {initial ? "Simpan" : "Tambah Produk"}
        </Button>
      </div>
    </Form>
  );
}
