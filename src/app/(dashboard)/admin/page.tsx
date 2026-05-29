"use client";

import { PageHeader } from "@/components/ui/page-header";
import { DashboardStats } from "@/features/admin/components/dashboard-stats";
import { UsersTable } from "@/features/admin/components/users-table";

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manajemen sistem & pengguna" />
      <DashboardStats />
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daftar Pengguna</h2>
        <UsersTable />
      </div>
    </div>
  );
}
