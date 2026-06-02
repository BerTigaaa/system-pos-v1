"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Select, Table, Switch, Button, Spin } from "antd";
import { useToast } from "@/components/ui/toast";
import { getRolePermissions, updateRolePermission, resetRolePermission } from "../actions";
import { sidebarSections } from "@/components/layout/sidebar";
import { hasPermission } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

const ACTIONS = ["view", "manage"] as const;

const ACTION_LABELS: Record<string, string> = {
  view: "Lihat",
  manage: "Kelola",
};

const ROLES: { label: string; value: string }[] = [
  { label: "OWNER", value: "OWNER" },
  { label: "CASHIER", value: "CASHIER" },
  { label: "WAREHOUSE", value: "WAREHOUSE" },
  { label: "FINANCE", value: "FINANCE" },
];

function withVisible(actions: string[]): string[] {
  const result = actions.filter((a) => a !== "visible");
  const has = result.includes("view") || result.includes("manage");
  if (has) result.push("visible");
  return result;
}

function getDefaultActions(role: UserRole, module: string): string[] {
  const defaults = ACTIONS.filter((a) => hasPermission(role, module, a));
  return withVisible(defaults);
}

export function RolePermissions() {
  const toast = useToast();
  const [role, setRole] = useState<UserRole>("OWNER");
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const menuItems = useMemo(() => {
    const result: { section: string; module: string; label: string }[] = [];
    for (const section of sidebarSections) {
      for (const item of section.items) {
        result.push({ section: section.label, module: item.module, label: item.label });
      }
    }
    return result;
  }, []);

  useEffect(() => {
    setLoading(true);
    getRolePermissions(role).then((res) => {
      if (res.success) {
        const map: Record<string, string[]> = {};
        res.data.forEach((o) => { map[o.module] = o.actions; });
        setOverrides(map);
      }
      setLoading(false);
    });
  }, [role]);

  const getEffective = useCallback(
    (module: string) => {
      if (module in overrides) return overrides[module];
      return getDefaultActions(role, module);
    },
    [role, overrides]
  );

  async function toggleAction(module: string, action: string, enabled: boolean) {
    const current = getEffective(module);
    const updated = withVisible(
      enabled
        ? [...current, action]
        : current.filter((a) => a !== action)
    );

    const defaults = getDefaultActions(role, module);
    const isDefault =
      defaults.length === updated.length && defaults.every((a) => updated.includes(a));

    if (isDefault) {
      const res = await resetRolePermission(role, module);
      if (res.success) {
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[module];
          return next;
        });
        toast.success("Permission diperbarui");
      } else {
        toast.error(res.error?.message ?? "Gagal");
      }
    } else {
      const res = await updateRolePermission(role, module, updated);
      if (res.success) {
        setOverrides((prev) => ({ ...prev, [module]: updated }));
        toast.success("Permission diperbarui");
      } else {
        toast.error(res.error?.message ?? "Gagal");
      }
    }
  }

  async function handleReset(module: string) {
    const res = await resetRolePermission(role, module);
    if (res.success) {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[module];
        return next;
      });
      toast.success("Reset ke default");
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  const columns = [
    {
      title: "Menu",
      dataIndex: "label",
      key: "label",
      width: 200,
    },
    ...ACTIONS.map((action) => ({
      title: ACTION_LABELS[action],
      key: action,
      width: 100,
      render: (_: unknown, record: { module: string }) => {
        const enabled = getEffective(record.module);
        return (
          <Switch
            checked={enabled.includes(action)}
            onChange={(v) => toggleAction(record.module, action, v)}
            size="small"
          />
        );
      },
    })),
    {
      title: "",
      key: "reset",
      width: 80,
      render: (_: unknown, record: { module: string }) =>
        record.module in overrides ? (
          <Button size="small" type="text" danger onClick={() => handleReset(record.module)}>
            Reset
          </Button>
        ) : null,
    },
  ];

  const dataSource = menuItems.map((item) => ({
    key: item.module,
    module: item.module,
    label: `${item.section} — ${item.label}`,
  }));

  return (
    <div>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Role</label>
        <Select
          value={role}
          onChange={setRole}
          style={{ width: 200 }}
          options={ROLES}
        />
        <p className="text-xs text-gray-400 mt-1">
          SUPER_ADMIN memiliki akses penuh dan tidak dapat diubah.
        </p>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
      />
    </div>
  );
}
