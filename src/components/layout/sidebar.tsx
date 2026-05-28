"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "antd";
import {
  DashboardOutlined, ShoppingCartOutlined,
  ClockCircleOutlined, AppstoreOutlined,
  BuildOutlined,
  FileTextOutlined,
  BankOutlined,
  BarChartOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { useUIStore } from "@/store/ui-store";

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard", module: "dashboard" },
  { key: "/pos", icon: <ShoppingCartOutlined />, label: "POS", module: "pos" },
  { key: "/shifts", icon: <ClockCircleOutlined />, label: "Shift", module: "shifts" },
  { key: "/products", icon: <AppstoreOutlined />, label: "Produk", module: "products" },
  { key: "/inventory", icon: <BuildOutlined />, label: "Gudang", module: "inventory" },
  { key: "/transactions", icon: <FileTextOutlined />, label: "Transaksi", module: "transactions" },
  { key: "/finance", icon: <BankOutlined />, label: "Keuangan", module: "finance" },
  { key: "/reports", icon: <BarChartOutlined />, label: "Laporan", module: "reports" },
  { key: "/settings", icon: <SettingOutlined />, label: "Pengaturan", module: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useUIStore();

  const filteredItems = menuItems.filter((item) => can(item.module));
  const isAdmin = session?.user?.role === "SUPER_ADMIN";
  const collapsed = sidebarCollapsed;

  const handleClick = useCallback(
    ({ key }: { key: string }) => {
      router.push(key);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    },
    [router, setSidebarOpen]
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`h-16 flex items-center ${collapsed ? "justify-center" : "gap-3 px-5"} border-b border-gray-200 dark:border-gray-700`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            BertigaPos
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[pathname]}
          items={filteredItems}
          onClick={handleClick}
          className="!border-none !bg-transparent"
        />

        {isAdmin && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2 mx-3" />
            <Menu
              mode="inline"
              inlineCollapsed={collapsed}
              selectedKeys={[pathname]}
              items={[
                {
                  key: "/admin/dashboard",
                  icon: <SafetyCertificateOutlined />,
                  label: "Admin Panel",
                },
              ]}
              onClick={handleClick}
              className="!border-none !bg-transparent"
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col fixed left-0 top-0 h-full z-30
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-60"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          md:hidden fixed left-0 top-0 h-full z-50
          bg-white dark:bg-gray-900 shadow-2xl
          transition-transform duration-300 ease-in-out
          w-60
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
