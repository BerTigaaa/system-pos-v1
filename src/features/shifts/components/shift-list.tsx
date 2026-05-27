"use client";

import { useState, useEffect } from "react";
import { Button, Space, Tag, Tooltip } from "antd";
import {
  StopOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { getShiftList } from "../actions";
import type { ShiftItem } from "../types";

export function ShiftList({ onClose }: { onClose: (shift: ShiftItem) => void }) {
  const { can } = usePermissions();
  const [data, setData] = useState<ShiftItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const load = async (p = page, s = search) => {
    setLoading(true);
    const res = await getShiftList({ page: p, search: s });
    if (res.success) {
      setData(res.data as ShiftItem[]);
      setTotal(res.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columns = [
    {
      title: "Kasir",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: string) =>
        v === "OPEN" ? (
          <Tag color="green">Buka</Tag>
        ) : (
          <Tag color="default">Tutup</Tag>
        ),
    },
    {
      title: "Saldo Awal",
      dataIndex: "openingBalance",
      key: "openingBalance",
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    {
      title: "Saldo Akhir",
      dataIndex: "closingBalance",
      key: "closingBalance",
      render: (v: number | null) =>
        v !== null ? `Rp ${v.toLocaleString("id")}` : "-",
    },
    {
      title: "Total Penjualan",
      dataIndex: "totalSales",
      key: "totalSales",
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    {
      title: "Transaksi",
      dataIndex: "totalTransactions",
      key: "totalTransactions",
      width: 100,
    },
    {
      title: "Buka",
      dataIndex: "openedAt",
      key: "openedAt",
      render: (v: string) => new Date(v).toLocaleString("id"),
    },
    {
      title: "Tutup",
      dataIndex: "closedAt",
      key: "closedAt",
      render: (v: string | null) =>
        v ? new Date(v).toLocaleString("id") : "-",
    },
    {
      title: "Aksi",
      key: "action",
      width: 80,
      render: (_: unknown, r: ShiftItem) =>
        r.status === "OPEN" && can("shifts", "close") ? (
          <Tooltip title="Tutup shift">
            <Button
              size="small"
              icon={<StopOutlined />}
              onClick={() => onClose(r)}
            />
          </Tooltip>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Cari kasir..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(1, e.target.value); }}
            className="w-72 pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, total, onChange: (p) => { setPage(p); load(p); } }}
      />
    </div>
  );
}
