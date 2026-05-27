"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button } from "antd";
import { createCustomer, updateCustomer } from "../actions";

type Props = {
  initial?: { id: string; name: string; phone: string; email?: string | null; address?: string | null; notes?: string | null } | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function CustomerForm({ initial, onSuccess, onCancel }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) form.setFieldsValue(initial);
    else form.resetFields();
  }, [initial, form]);

  async function handleSubmit(values: Record<string, unknown>) {
    setLoading(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v ?? "")));

    const res = initial ? await updateCustomer(initial.id, fd) : await createCustomer(fd);
    setLoading(false);

    if (res.success) onSuccess();
    else form.setFields([{ name: "phone", errors: [res.error?.message ?? "Gagal"] }]);
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
      <Form.Item name="name" label="Nama" rules={[{ required: true, message: "Wajib diisi" }]}>
        <Input placeholder="Nama pelanggan" />
      </Form.Item>
      <Form.Item name="phone" label="Telepon" rules={[{ required: true, message: "Wajib diisi" }, { min: 10, message: "Min 10 digit" }]}>
        <Input placeholder="081234567890" />
      </Form.Item>
      <Form.Item name="email" label="Email">
        <Input placeholder="opsional@email.com" />
      </Form.Item>
      <Form.Item name="address" label="Alamat">
        <Input.TextArea rows={2} placeholder="Opsional" />
      </Form.Item>
      <Form.Item name="notes" label="Catatan">
        <Input.TextArea rows={2} placeholder="Opsional" />
      </Form.Item>
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel}>Batal</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {initial ? "Simpan" : "Tambah Pelanggan"}
        </Button>
      </div>
    </Form>
  );
}
