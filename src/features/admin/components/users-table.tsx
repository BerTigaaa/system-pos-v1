"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Select, Button, Switch } from "antd";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/components/ui/toast";
import { getUsers, toggleUserStatus, updateUserRole } from "../actions";

type UserRole = "SUPER_ADMIN" | "OWNER" | "CASHIER" | "WAREHOUSE" | "FINANCE";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "red",
  OWNER: "blue",
  CASHIER: "green",
  WAREHOUSE: "orange",
  FINANCE: "purple",
};

const statusColors: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
};

export function UsersTable() {
  const toast = useToast();
  const [data, setData] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getUsers({ search, role: roleFilter, status: statusFilter, page, pageSize: 20 });
    if (res.success) { setData(res.data as UserRow[]); setTotal(res.total); }
    setLoading(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleStatus(userId: string) {
    const res = await toggleUserStatus(userId);
    if (res.success) {
      toast.success("Status berhasil diubah");
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    const res = await updateUserRole(userId, role as UserRole);
    if (res.success) {
      toast.success("Role berhasil diubah");
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  }

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name", width: 180 },
    { title: "Email", dataIndex: "email", key: "email", width: 220 },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (v: string, record: UserRow) => (
        <Select
          value={v}
          size="small"
          style={{ width: 110 }}
          onChange={(val) => handleRoleChange(record.id, val as UserRole)}
          options={[
            { label: "OWNER", value: "OWNER" },
            { label: "CASHIER", value: "CASHIER" },
            { label: "WAREHOUSE", value: "WAREHOUSE" },
            { label: "FINANCE", value: "FINANCE" },
          ]}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
    {
      title: "Aktif",
      key: "active",
      width: 80,
      render: (_: unknown, record: UserRow) => (
        <Switch
          checked={record.status === "ACTIVE"}
          onChange={() => handleToggleStatus(record.id)}
          size="small"
        />
      ),
    },
    {
      title: "Dibuat",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (v: Date) => new Date(v).toLocaleString("id-ID"),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Cari nama/email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-56 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <Select
          allowClear
          placeholder="Role"
          style={{ width: 120 }}
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
          options={["SUPER_ADMIN", "OWNER", "CASHIER", "WAREHOUSE", "FINANCE"].map((r) => ({ label: r, value: r }))}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 120 }}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          options={["ACTIVE", "INACTIVE"].map((s) => ({ label: s, value: s }))}
        />
      </div>
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p) }}
      />
    </div>
  );
}
