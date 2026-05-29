"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Space, Select, DatePicker, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { getAuditLogs, getAuditLogModules } from "../actions";
import { getActionLabel, getModuleLabel, moduleLabels } from "@/lib/audit-log-labels";

const { RangePicker } = DatePicker;

type LogRow = {
  id: string;
  user: { id: string; name: string; email: string } | null;
  action: string;
  module: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export function AuditLogTable() {
  const [data, setData] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    getAuditLogModules().then((res) => {
      if (res.success) setModules(res.data as string[]);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAuditLogs({
      search,
      module: moduleFilter,
      dateFrom: dateRange?.[0],
      dateTo: dateRange?.[1],
      page,
      pageSize,
    });
    if (res.success) {
      setData(res.data as LogRow[]);
      setTotal(res.total);
    }
    setLoading(false);
  }, [page, pageSize, search, moduleFilter, dateRange]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      title: "Waktu",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (v: Date) => new Date(v).toLocaleString("id-ID"),
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 160,
      render: (u: { name: string; email: string } | null) =>
        u ? <span>{u.name}<br /><span className="text-xs text-gray-400">{u.email}</span></span> : <span className="text-gray-400">Sistem</span>,
    },
    {
      title: "Aksi",
      dataIndex: "action",
      key: "action",
      width: 180,
      render: (v: string) => {
        const info = getActionLabel(v);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "Modul",
      dataIndex: "module",
      key: "module",
      width: 120,
      render: (v: string) => <Tag color="blue">{getModuleLabel(v)}</Tag>,
    },
    { title: "Deskripsi", dataIndex: "description", key: "description" },
    {
      title: "IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 130,
      render: (v: string | null) => v ?? "-",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Cari deskripsi..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-56 pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <Select
            allowClear
            placeholder="Modul"
            style={{ width: 150 }}
            value={moduleFilter}
            onChange={(v) => { setModuleFilter(v); setPage(1); }}
            options={modules.map((m) => ({ label: getModuleLabel(m), value: m }))}
          />
          <RangePicker
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([dateStrings[0], dateStrings[1]]);
              } else {
                setDateRange(null);
              }
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
}
