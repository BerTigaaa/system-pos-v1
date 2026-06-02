"use client";

import { useState, useEffect } from "react";
import { Button, Space } from "antd";
import { useToast } from "@/components/ui/toast";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { AppDrawer } from "@/components/ui/drawer";
import { usePermissions } from "@/hooks/use-permissions";
import { getSuppliers, deleteSupplier } from "../actions";
import { SupplierForm } from "./supplier-form";
import type { SupplierItem } from "../types";

export function SupplierTable() {
  const toast = useToast();
  const { can } = usePermissions();
  const [data, setData] = useState<SupplierItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierItem | null>(null);

  const load = async (p = page, s = search) => {
    setLoading(true);
    const res = await getSuppliers({ page: p, search: s });
    if (res.success) { setData(res.data as SupplierItem[]); setTotal(res.total); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const res = await deleteSupplier(id);
    if (res.success) { toast.success("Supplier dihapus"); load(); }
    else toast.error(res.error?.message ?? "Gagal menghapus");
  };

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "Telepon", dataIndex: "phone", key: "phone", render: (v: string | null) => v ?? "-" },
    { title: "Email", dataIndex: "email", key: "email", render: (v: string | null) => v ?? "-" },
    { title: "Alamat", dataIndex: "address", key: "address", render: (v: string | null) => v ?? "-" },
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => new Date(v).toLocaleDateString("id"),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_: unknown, r: SupplierItem) => (
        <Space>
          {can("inventory", "manage") && (
            <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); setDrawerOpen(true); }} />
          )}
          {can("inventory", "manage") && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Cari nama/telepon..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(1, e.target.value); }}
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {can("inventory", "manage") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setDrawerOpen(true); }}>
            Tambah Supplier
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, total, onChange: (p) => { setPage(p); load(p); } }}
      />

      <AppDrawer
        title={editing ? "Edit Supplier" : "Tambah Supplier"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
      >
        <SupplierForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSuccess={() => { setDrawerOpen(false); setEditing(null); load(); toast.success("Berhasil"); }}
          onCancel={() => { setDrawerOpen(false); setEditing(null); }}
        />
      </AppDrawer>
    </div>
  );
}
