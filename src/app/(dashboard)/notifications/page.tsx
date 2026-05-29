"use client";

import { useState, useEffect, useCallback } from "react";
import { List, Tag, Button, Typography, Empty } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { getNotifications, markAsRead, markAllAsRead } from "@/features/notifications/actions";

const { Text } = Typography;

type NotifItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: Date;
};

const notifColors: Record<string, string> = {
  refund: "red",
  stock_low: "orange",
  info: "blue",
  warning: "gold",
};

export default function NotificationsPage() {
  const [data, setData] = useState<NotifItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getNotifications(page, 20);
    if (res.success) {
      setData(res.data as NotifItem[]);
      setTotal(res.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleMarkAll() {
    await markAllAsRead();
    setData((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleMarkOne(id: string) {
    await markAsRead(id);
    setData((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  const columns = [
    {
      title: "",
      dataIndex: "isRead",
      key: "read",
      width: 40,
      render: (v: boolean) => !v && <div className="w-2 h-2 rounded-full bg-blue-500" />,
    },
    {
      title: "Tipe",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (v: string) => <Tag color={notifColors[v] ?? "default"}>{v}</Tag>,
    },
    {
      title: "Judul",
      dataIndex: "title",
      key: "title",
      width: 200,
    },
    {
      title: "Pesan",
      dataIndex: "message",
      key: "message",
    },
    {
      title: "Waktu",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (v: Date) => new Date(v).toLocaleString("id-ID"),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: unknown, record: NotifItem) =>
        !record.isRead && (
          <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => handleMarkOne(record.id)} />
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Notifikasi" subtitle="Pusat notifikasi sistem" />
      <div className="mb-4 flex justify-end">
        {data.some((n) => !n.isRead) && (
          <Button onClick={handleMarkAll} icon={<CheckOutlined />}>
            Tandai semua dibaca
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
