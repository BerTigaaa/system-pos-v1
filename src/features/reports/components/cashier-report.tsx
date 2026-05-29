"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, DatePicker, Table, Spin } from "antd";
import { getCashierReport } from "../actions";
import type { CashierReportRow } from "../types";

const { RangePicker } = DatePicker;

export function CashierReport() {
  const [data, setData] = useState<CashierReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashierId, setCashierId] = useState<string>();
  const [dateFrom, setDateFrom] = useState<string>();
  const [dateTo, setDateTo] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getCashierReport({ cashierId, dateFrom, dateTo });
    if (res.success) setData(res.data as CashierReportRow[]);
    setLoading(false);
  }, [cashierId, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: "Kasir", dataIndex: "cashierName", key: "cashierName" },
    {
      title: "Transaksi",
      dataIndex: "totalTransactions",
      key: "totalTransactions",
      width: 100,
      align: "center" as const,
    },
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
      <div className="flex flex-wrap gap-3">
        <RangePicker
          onChange={(_, dateStrings) => {
            if (dateStrings[0] && dateStrings[1]) {
              setDateFrom(dateStrings[0]);
              setDateTo(dateStrings[1]);
            } else {
              setDateFrom(undefined);
              setDateTo(undefined);
            }
          }}
        />
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="cashierId"
        pagination={false}
        size="small"
      />
    </div>
  );
}
