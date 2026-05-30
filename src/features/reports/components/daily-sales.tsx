"use client";

import { useState, useEffect, useCallback } from "react";
import { DatePicker, Table, Spin } from "antd";
import dayjs from "dayjs";
import { getDailySales } from "../actions";
import type { DailySalesRow } from "../types";

export function DailySalesReport() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [data, setData] = useState<DailySalesRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDailySales(date);
      if (res.success) setData(res.data as DailySalesRow[]);
    } catch (err) {
      console.error("Gagal memuat laporan harian:", err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const totalTransaksi = data.reduce((s, r) => s + r.transactionCount, 0);
  const totalRevenue = data.reduce((s, r) => s + r.totalRevenue, 0);
  const totalItems = data.reduce((s, r) => s + r.totalItems, 0);

  const columns = [
    { title: "Jam", dataIndex: "hour", key: "hour", width: 80 },
    { title: "Transaksi", dataIndex: "transactionCount", key: "transactionCount", width: 100, align: "center" as const },
    { title: "Item Terjual", dataIndex: "totalItems", key: "totalItems", width: 100, align: "center" as const },
    {
      title: "Pendapatan",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 150,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
  ];

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  return (
    <div className="space-y-4">
      <DatePicker
        defaultValue={dayjs()}
        onChange={(d) => d && setDate(d.format("YYYY-MM-DD"))}
      />
      <div className="flex gap-6 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
          <span className="text-gray-500">Total Transaksi</span>
          <div className="text-xl font-bold">{totalTransaksi}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
          <span className="text-gray-500">Total Item</span>
          <div className="text-xl font-bold">{totalItems}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
          <span className="text-gray-500">Pendapatan</span>
          <div className="text-xl font-bold text-green-600">Rp {totalRevenue.toLocaleString("id")}</div>
        </div>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="hour"
        pagination={false}
        size="small"
      />
    </div>
  );
}
