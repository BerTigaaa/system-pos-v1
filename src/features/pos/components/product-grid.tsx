"use client";

import { useEffect, useState, useCallback } from "react";
import { Input, Select, Spin } from "antd";
import { SearchOutlined, InboxOutlined } from "@ant-design/icons";
import { getPosProducts } from "../actions";
import { useCartStore, type PosProduct } from "../store";

export function ProductGrid() {
  const addItem = useCartStore((s) => s.addItem);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getPosProducts({ search, categoryId });
    if (res.success) {
      setProducts(res.data as PosProduct[]);
      setTotal(res.total);
    }
    setLoading(false);
  }, [search, categoryId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    import("@/features/products/actions").then((mod) =>
      mod.getCategories().then((res) => {
        if (res.success) setCategories(res.data ?? []);
      })
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Input
          prefix={<SearchOutlined className="text-gray-300" />}
          placeholder="Cari nama, SKU, atau scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md"
          allowClear
          size="large"
          variant="outlined"
          style={{ borderRadius: 10 }}
        />
        <Select
          placeholder="Semua kategori"
          allowClear
          style={{ minWidth: 160 }}
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
          size="large"
          variant="outlined"
          className="min-w-[140px]"
        />
        <div className="ml-auto text-xs text-gray-400 tabular-nums">
          {total} produk
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300 dark:text-gray-600 gap-3">
            <InboxOutlined className="text-5xl" />
            <span className="text-sm">Produk tidak ditemukan</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="group relative flex flex-col rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 text-left overflow-hidden"
              >
                <div className="aspect-square bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-gray-200 dark:text-gray-700 select-none tracking-tight">
                      {p.name.charAt(0)}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/60 dark:from-gray-900/60 to-transparent" />
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-snug">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate font-mono">{p.sku}</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    Rp {p.sellPrice.toLocaleString("id")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
