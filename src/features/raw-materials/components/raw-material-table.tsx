"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Space, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, WarningOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { AppDrawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { getRawMaterials, deleteRawMaterial } from "../actions";
import { RawMaterialForm } from "./raw-material-form";
import type { RawMaterialWithStats } from "../types";

export function RawMaterialTable() {
  const toast = useToast();
  const { can } = usePermissions();
  const [data, setData] = useState<RawMaterialWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterialWithStats | null>(null);

  const load = useCallback(async (p = page, s = search) => {
    setLoading(true);
    const res = await getRawMaterials({ page: p, search: s });
    if (res.success) {
      setData(res.data as RawMaterialWithStats[]);
      setTotal(res.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const res = await deleteRawMaterial(id);
    if (res.success) {
      toast.success("Bahan baku dihapus");
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal menghapus");
    }
  };

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Kategori", dataIndex: "category", key: "category", render: (v: string | null) => v ?? "-" },
    { title: "Satuan", dataIndex: "unit", key: "unit", width: 80 },
    {
      title: "Stok", dataIndex: "stock", key: "stock", width: 80,
      render: (v: number, r: RawMaterialWithStats) => {
        if (v === 0) return <Tag color="red" className="!m-0">{v}</Tag>;
        if (v <= r.minStock) return <Tag color="orange" className="!m-0">{v}</Tag>;
        return <span>{v}</span>;
      },
    },
    { title: "Min Stok", dataIndex: "minStock", key: "minStock", width: 80 },
    {
      title: "Batch Aktif", dataIndex: "activeBatches", key: "activeBatches", width: 90,
      render: (v: number) => v > 0 ? v : "-",
    },
    {
      title: "Kadaluwarsa Terdekat", dataIndex: "latestBatchExpiry", key: "latestBatchExpiry", width: 140,
      render: (v: string | null) => {
        if (!v) return "-";
        const d = new Date(v);
        const msg = d.toLocaleDateString("id");
        const isExpired = d < new Date();
        const isSoon = !isExpired && d < new Date(Date.now() + 14 * 86400000);
        if (isExpired) return <Tag color="red" className="!m-0">{msg} (exp)</Tag>;
        if (isSoon) return <Tag color="orange" className="!m-0">{msg}</Tag>;
        return msg;
      },
    },
    {
      title: "Aksi", key: "action", width: 100,
      render: (_: unknown, r: RawMaterialWithStats) => (
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
          placeholder="Cari nama/SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(1, e.target.value); }}
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {can("inventory", "manage") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setDrawerOpen(true); }}>
            Tambah Bahan Baku
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
        title={editing ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
      >
        <RawMaterialForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSuccess={() => { setDrawerOpen(false); setEditing(null); load(); toast.success("Berhasil"); }}
          onCancel={() => { setDrawerOpen(false); setEditing(null); }}
        />
      </AppDrawer>
    </div>
  );
}
