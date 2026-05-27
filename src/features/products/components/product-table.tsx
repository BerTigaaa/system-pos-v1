"use client";

import { useState, useEffect } from "react";
import { Button, Space, Tag, Popconfirm, Switch, Image } from "antd";
import { useToast } from "@/components/ui/toast";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { AppDrawer } from "@/components/ui/drawer";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { getProducts, deleteProduct, toggleProductActive } from "../actions";
import { ProductForm } from "./product-form";
import { CategoryManager } from "./category-manager";
import type { ProductWithCategory } from "../types";

export function ProductTable() {
  const toast = useToast();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);

  const load = async (p = page, s = search) => {
    setLoading(true);
    const res = await getProducts({ page: p, pageSize: 10, search: s });
    if (res.success) {
      setProducts(res.data as ProductWithCategory[]);
      setTotal(res.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    const res = await deleteProduct(id);
    if (res.success) { toast.success("Produk dihapus"); load(); }
    else toast.error(res.error?.message ?? "Gagal");
  }

  async function handleToggle(id: string, checked: boolean) {
    await toggleProductActive(id, checked);
    load();
  }

  const columns = [
    {
      title: "",
      dataIndex: "imageUrl",
      key: "image",
      width: 52,
      render: (v: string | null) => (
        <Image
          src={v ?? ""}
          alt=""
          width={36}
          height={36}
          style={{ objectFit: "cover", borderRadius: 6 }}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIGZpbGw9IiNGMUYxRjEiLz48dGV4dCB4PSIxOCIgeT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTAiPk5vIEltZzwvdGV4dD48L3N2Zz4="
        />
      ),
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (n: string, r: ProductWithCategory) => (
        <div>
          <div className="font-medium">{n}</div>
          <div className="text-xs text-gray-400">{r.sku}</div>
        </div>
      ),
    },
    {
      title: "Kategori",
      dataIndex: ["category", "name"],
      key: "category",
      width: 120,
      render: (v: string | null) => v ? <Tag>{v}</Tag> : "-",
    },
    {
      title: "Harga Jual",
      dataIndex: "sellPrice",
      key: "sellPrice",
      width: 130,
      render: (v: number) => `Rp ${Number(v).toLocaleString("id")}`,
    },
    {
      title: "Stok",
      dataIndex: "stock",
      key: "stock",
      width: 80,
      render: (v: number, r: ProductWithCategory) => {
        const low = v <= r.minStock;
        return <span className={low ? "text-red-500 font-semibold" : ""}>{v}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (v: boolean, r: ProductWithCategory) => (
        <Switch size="small" checked={v} onChange={(c) => handleToggle(r.id, c)} />
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 120,
      render: (_: unknown, r: ProductWithCategory) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditing(r); setDrawerOpen(true); }}
          />
          <Popconfirm title="Hapus produk?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(1, e.target.value); }}
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <div className="flex gap-2">
          {can("products", "create") && <CategoryManager />}
          {can("products", "create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setDrawerOpen(true); }}>
              Tambah Produk
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          onChange: (p) => { setPage(p); load(p); },
        }}
      />

      <AppDrawer
        title={editing ? "Edit Produk" : "Tambah Produk"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
      >
        <ProductForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSuccess={() => { setDrawerOpen(false); setEditing(null); load(); toast.success("Berhasil"); }}
          onCancel={() => { setDrawerOpen(false); setEditing(null); }}
        />
      </AppDrawer>
    </div>
  );
}
