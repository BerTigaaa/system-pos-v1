"use client";

import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Table, Space, Popconfirm } from "antd";
import { useToast } from "@/components/ui/toast";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../actions";
import type { CategoryItem } from "../types";

export function CategoryManager() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    const res = await getCategories();
    if (res.success) setCategories(res.data);
    setLoading(false);
  };

  async function handleSubmit(values: { name: string; description?: string }) {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("description", values.description ?? "");

    const res = editing
      ? await updateCategory(editing.id, fd)
      : await createCategory(fd);

    if (res.success) {
      toast.success(editing ? "Kategori diupdate" : "Kategori dibuat");
      form.resetFields();
      setEditing(null);
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteCategory(id);
    if (res.success) {
      toast.success("Kategori dihapus");
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    {
      title: "Produk",
      dataIndex: ["_count", "products"],
      key: "products",
      width: 100,
    },
    {
      title: "Aksi",
      key: "action",
      width: 120,
      render: (_: unknown, r: CategoryItem) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(r);
              form.setFieldsValue(r);
            }}
          />
          <Popconfirm title="Hapus kategori?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button type="dashed" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        Kelola Kategori
      </Button>

      <Modal
        title="Manajemen Kategori"
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        footer={null}
        width={480}
      >
        <Form form={form} layout="inline" onFinish={handleSubmit} className="mb-4">
          <Form.Item name="name" rules={[{ required: true, message: "Wajib" }]} className="!mb-0">
            <Input placeholder="Nama kategori" />
          </Form.Item>
          <Form.Item name="description" className="!mb-0">
            <Input placeholder="Deskripsi (opsional)" />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={editing ? <EditOutlined /> : <PlusOutlined />}>
            {editing ? "Update" : "Tambah"}
          </Button>
        </Form>

        <Table
          dataSource={categories}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Modal>
    </>
  );
}
