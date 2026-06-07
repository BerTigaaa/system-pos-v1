"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { getExpiringBatches } from "../actions";

export function ExpiryWarning() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getExpiringBatches(14);
    if (res.success) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: "Bahan Baku", dataIndex: "rawMaterialName", key: "rawMaterialName" },
    { title: "SKU", dataIndex: "rawMaterialSku", key: "rawMaterialSku" },
    { title: "Batch", dataIndex: "batchCode", key: "batchCode", render: (v: string | null) => v ?? "-" },
    { title: "Sisa Stok", dataIndex: "quantity", key: "quantity" },
    {
      title: "Kadaluwarsa", dataIndex: "expiryDate", key: "expiryDate",
      render: (v: string) => {
        const d = new Date(v);
        const isExpired = d < new Date();
        const isSoon = d < new Date(Date.now() + 7 * 86400000);
        return (
          <Tag color={isExpired ? "red" : isSoon ? "orange" : "default"} icon={<WarningOutlined />}>
            {d.toLocaleDateString("id")}
            {isExpired ? " (EXPIRED)" : isSoon ? " (≤7 hari)" : ""}
          </Tag>
        );
      },
    },
    { title: "Supplier", dataIndex: "supplierName", key: "supplierName", render: (v: string | null) => v ?? "-" },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      {!loading && data.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">Tidak ada batch yang mendekati kadaluwarsa.</p>
      )}
    </div>
  );
}
