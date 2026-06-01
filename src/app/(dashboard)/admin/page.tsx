"use client";

import { Tabs } from "antd";
import { UserOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardStats } from "@/features/admin/components/dashboard-stats";
import { UsersTable } from "@/features/admin/components/users-table";
import { RolePermissions } from "@/features/admin/components/role-permissions";

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manajemen sistem & pengguna" />
      <div className="mt-4">
        <Tabs
          items={[
            {
              key: "users",
              label: <span><UserOutlined /> Pengguna</span>,
              children: (
                <>
                  <DashboardStats />
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daftar Pengguna</h2>
                    <UsersTable />
                  </div>
                </>
              ),
            },
            {
              key: "permissions",
              label: <span><SafetyCertificateOutlined /> Role & Permission</span>,
              children: <RolePermissions />,
            },
          ]}
        />
      </div>
    </div>
  );
}
