"use client";

import { useState, useEffect } from "react";
import { Button, Space, Popconfirm } from "antd";
import { useToast } from "@/components/ui/toast";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { AppDrawer } from "@/components/ui/drawer";
import { usePermissions } from "@/hooks/use-permissions";
import { getCustomers, deleteCustomer } from "../actions";
import { CustomerForm } from "./customer-form";
import type { CustomerItem } from "../types";

export function CustomerTable() {
  const toast = useToast();
  const { can } = usePermissions();
  const [data, setData] = useState<CustomerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerItem | null>(null);

  const load = async (p = page, s = search) => {
    setLoading(true);
    const res = await getCustomers({ page: p, search: s });
    if (res.success) { setData(res.data as CustomerItem[]); setTotal(res.total); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    const res = await deleteCustomer(id);
    if (res.success) { toast.success("Pelanggan dihapus"); load(); }
    else toast.error(res.error?.message ?? "Gagal");
  }

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "Telepon", dataIndex: "phone", key: "phone" },
    {
      title: "Total Belanja",
      dataIndex: "totalSpent",
      key: "totalSpent",
      width: 140,
      render: (v: number) => `Rp ${Number(v).toLocaleString("id")}`,
    },
    { title: "Transaksi", dataIndex: "totalOrders", key: "totalOrders", width: 100 },
    {
      title: "Tanggal Daftar",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (v: string) => new Date(v).toLocaleDateString("id"),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_: unknown, r: CustomerItem) => (
        <Space>
          {can("customers", "edit") && (
            <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); setDrawerOpen(true); }} />
          )}
          {can("customers", "delete") && (
            <Popconfirm title="Hapus pelanggan?" onConfirm={() => handleDelete(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
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
          placeholder="Cari nama/telepon/email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(1, e.target.value); }}
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {can("customers", "create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setDrawerOpen(true); }}>
            Tambah Pelanggan
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
        title={editing ? "Edit Pelanggan" : "Tambah Pelanggan"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
      >
        <CustomerForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSuccess={() => { setDrawerOpen(false); setEditing(null); load(); toast.success("Berhasil"); }}
          onCancel={() => { setDrawerOpen(false); setEditing(null); }}
        />
      </AppDrawer>
    </div>
  );
}
