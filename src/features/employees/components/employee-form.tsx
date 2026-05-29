"use client";

import { useState } from "react";
import { Modal, Form, Input, Select, Button } from "antd";
import { useToast } from "@/components/ui/toast";
import { createEmployee, updateEmployee } from "../actions";
import type { EmployeeFormData, EmployeeItem } from "../types";

export function EmployeeForm({
  initial,
  open,
  onClose,
  onSuccess,
}: {
  initial?: EmployeeItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setSubmitting(true);
    const data = values as EmployeeFormData;

    const res = initial
      ? await updateEmployee(initial.id, data)
      : await createEmployee(data);

    setSubmitting(false);

    if (res.success) {
      toast.success(initial ? "Karyawan diupdate" : "Karyawan ditambahkan");
      form.resetFields();
      onSuccess();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  }

  return (
    <Modal
      title={initial ? "Edit Karyawan" : "Tambah Karyawan"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          initial
            ? { name: initial.name, email: initial.email, role: initial.role, phone: initial.phone ?? "" }
            : { role: "CASHIER" }
        }
        className="mt-4"
      >
        <Form.Item name="name" label="Nama" rules={[{ required: true, message: "Wajib diisi" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Email tidak valid" }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label={initial ? "Password Baru (kosongkan jika tidak diganti)" : "Password"}
          rules={initial ? [] : [{ required: true, min: 6, message: "Minimal 6 karakter" }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item name="role" label="Role" rules={[{ required: true, message: "Pilih role" }]}>
          <Select
            options={[
              { label: "Owner", value: "OWNER" },
              { label: "Kasir", value: "CASHIER" },
              { label: "Gudang", value: "WAREHOUSE" },
              { label: "Keuangan", value: "FINANCE" },
            ]}
          />
        </Form.Item>
        <Form.Item name="phone" label="Telepon">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
