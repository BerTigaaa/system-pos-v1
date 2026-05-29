"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardOutlined, ShoppingCartOutlined,
  ClockCircleOutlined, AppstoreOutlined,
  BuildOutlined,
  FileTextOutlined,
  BankOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  AuditOutlined,
  BellOutlined,
  CrownOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { usePermissions } from "@/hooks/use-permissions";
import { useUIStore } from "@/store/ui-store";

type Section = {
  label: string;
  iconColor: string;
  items: {
    key: string;
    icon: React.ReactNode;
    label: string;
    module: string;
  }[];
};

const sections: Section[] = [
  {
    label: "Utama",
    iconColor: "text-blue-500",
    items: [
      { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard", module: "dashboard" },
      { key: "/pos", icon: <ShoppingCartOutlined />, label: "POS", module: "pos" },
    ],
  },
  {
    label: "Bisnis",
    iconColor: "text-amber-500",
    items: [
      { key: "/shifts", icon: <ClockCircleOutlined />, label: "Shift", module: "shifts" },
      { key: "/products", icon: <AppstoreOutlined />, label: "Produk", module: "products" },
      { key: "/inventory", icon: <BuildOutlined />, label: "Gudang", module: "inventory" },
      { key: "/transactions", icon: <FileTextOutlined />, label: "Transaksi", module: "transactions" },
    ],
  },
  {
    label: "Keuangan & Laporan",
    iconColor: "text-emerald-500",
    items: [
      { key: "/finance", icon: <BankOutlined />, label: "Keuangan", module: "finance" },
      { key: "/reports", icon: <BarChartOutlined />, label: "Laporan", module: "reports" },
    ],
  },
  {
    label: "Administrasi",
    iconColor: "text-violet-500",
    items: [
      { key: "/admin", icon: <CrownOutlined />, label: "Admin", module: "admin" },
      { key: "/employees", icon: <UserOutlined />, label: "Karyawan", module: "employees" },
    ],
  },
  {
    label: "Sistem",
    iconColor: "text-slate-400",
    items: [
      { key: "/audit-logs", icon: <AuditOutlined />, label: "Audit Log", module: "audit" },
      { key: "/notifications", icon: <BellOutlined />, label: "Notifikasi", module: "notifications" },
      { key: "/settings", icon: <SettingOutlined />, label: "Pengaturan", module: "settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useUIStore();
  const collapsed = sidebarCollapsed;

  const filteredSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => can(item.module)),
        }))
        .filter((section) => section.items.length > 0),
    [can]
  );

  const handleClick = useCallback(
    (key: string) => {
      router.push(key);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    },
    [router, setSidebarOpen]
  );

  const isActive = (key: string) => {
    if (key === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(key);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div className={`h-16 flex items-center border-b border-gray-100 dark:border-gray-800/80 ${collapsed ? "justify-center px-0" : "gap-3 px-5"}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight truncate">
              BertigaPos
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">
              POS System
            </span>
          </div>
        )}
      </div>

      {/* ── Menu ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        {filteredSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                  {section.label}
                </span>
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.key);

                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => handleClick(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={`
                        relative flex items-center w-full rounded-lg transition-all duration-200 group
                        ${collapsed ? "justify-center h-11 w-11 mx-auto" : "h-10 px-3 gap-3"}
                        ${active
                          ? "bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                        }
                      `}
                    >
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                      )}

                      <span className={`
                        ${collapsed ? "text-lg" : "text-base"}
                        ${active ? section.iconColor : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}
                        transition-colors duration-200
                      `}>
                        {item.icon}
                      </span>

                      {!collapsed && (
                        <span className="text-sm truncate">{item.label}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed && (
        <div className="px-3 pb-4">
          <div className="flex justify-center">
            <ToolOutlined className="text-gray-300 dark:text-gray-600 text-xs" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={`
          hidden md:flex flex-col fixed left-0 top-0 h-full z-30
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
        `}
      >
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          md:hidden fixed left-0 top-0 h-full z-50
          bg-white dark:bg-gray-900 shadow-2xl
          transition-transform duration-300 ease-in-out
          w-64
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
