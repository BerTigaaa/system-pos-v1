"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Space, Select, Popconfirm, Tag } from "antd";
import { PlusOutlined, EditOutlined, KeyOutlined } from "@ant-design/icons";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePermissions } from "@/hooks/use-permissions";
import { getEmployees, toggleEmployeeActive, resetEmployeePassword } from "../actions";
import { EmployeeForm } from "./employee-form";
import type { EmployeeItem } from "../types";

export function EmployeeTable() {
  const toast = useToast();
  const { can } = usePermissions();
  const [data, setData] = useState<EmployeeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getEmployees({ search, role: roleFilter, status: statusFilter });
    if (res.success) {
      setData(res.data as EmployeeItem[]);
      setTotal(res.total);
    }
    setLoading(false);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(id: string, active: boolean) {
    const res = await toggleEmployeeActive(id, active);
    if (res.success) { toast.success(active ? "Diaktifkan" : "Dinonaktifkan"); load(); }
    else toast.error(res.error?.message ?? "Gagal");
  }

  async function handleResetPassword(id: string) {
    const res = await resetEmployeePassword(id);
    if (res.success) { toast.success(res.message ?? "Password direset"); load(); }
    else toast.error(res.error?.message ?? "Gagal");
  }

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email", width: 220 },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: "Terakhir Login",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      width: 170,
      render: (v: Date | null) => (v ? new Date(v).toLocaleString("id-ID") : "-"),
    },
    {
      title: "Aksi",
      key: "action",
      width: 160,
      render: (_: unknown, r: EmployeeItem) => (
        <Space size="small">
          {can("employees", "edit") && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); setFormOpen(true); }} />
              <Popconfirm
                title={r.status === "ACTIVE" ? "Nonaktifkan karyawan?" : "Aktifkan karyawan?"}
                onConfirm={() => handleToggle(r.id, r.status !== "ACTIVE")}
              >
                <Button size="small">
                  {r.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </Popconfirm>
              <Popconfirm title="Reset password ke default?" onConfirm={() => handleResetPassword(r.id)}>
                <Button size="small" icon={<KeyOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Cari nama/email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <Select
            allowClear
            placeholder="Role"
            style={{ width: 130 }}
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { label: "Owner", value: "OWNER" },
              { label: "Kasir", value: "CASHIER" },
              { label: "Gudang", value: "WAREHOUSE" },
              { label: "Keuangan", value: "FINANCE" },
            ]}
          />
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 130 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Aktif", value: "ACTIVE" },
              { label: "Nonaktif", value: "INACTIVE" },
            ]}
          />
        </div>
        {can("employees", "create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Tambah Karyawan
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: 1, total, pageSize: 20 }}
      />

      <EmployeeForm
        initial={editing}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={() => { setFormOpen(false); setEditing(null); load(); }}
      />
    </div>
  );
}
