"use client";

import { useState } from "react";
import { Form, Input, Button } from "antd";
import { useToast } from "@/components/ui/toast";
import { createSupplier, updateSupplier } from "../actions";
import type { SupplierFormData, SupplierItem } from "../types";

export function SupplierForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: SupplierItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SupplierFormData) => {
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, v ?? ""));
    const res = initial
      ? await updateSupplier(initial.id, fd)
      : await createSupplier(fd);
    if (res.success) onSuccess();
    else toast.error(res.error?.message ?? "Gagal menyimpan");
    setSubmitting(false);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initial ?? {}}
      onFinish={handleSubmit}
    >
      <Form.Item name="name" label="Nama" rules={[{ required: true, message: "Nama wajib diisi" }]}>
        <Input placeholder="Nama supplier" />
      </Form.Item>
      <Form.Item name="phone" label="Telepon">
        <Input placeholder="08xxxx" />
      </Form.Item>
      <Form.Item name="email" label="Email">
        <Input type="email" placeholder="supplier@email.com" />
      </Form.Item>
      <Form.Item name="address" label="Alamat">
        <Input.TextArea rows={2} placeholder="Alamat" />
      </Form.Item>
      <Form.Item name="notes" label="Catatan">
        <Input.TextArea rows={2} placeholder="Catatan" />
      </Form.Item>
      <Form.Item className="mb-0 text-right">
        <Button onClick={onCancel} className="mr-2">Batal</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {initial ? "Simpan" : "Tambah"}
        </Button>
      </Form.Item>
    </Form>
  );
}
