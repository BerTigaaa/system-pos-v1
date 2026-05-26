"use client";

import { useCallback } from "react";
import { Dropdown, Avatar, Badge, Tooltip } from "antd";
import {
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    darkMode,
    toggleDarkMode,
  } = useUIStore();

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: (
        <div className="!leading-tight">
          <div className="font-medium text-sm">{session?.user?.name}</div>
          <div className="text-gray-400 text-xs">{session?.user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" as const },
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "Ganti Password",
    },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Keluar",
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger - hidden on md+ */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
        >
          <MenuOutlined className="text-lg" />
        </button>

        {/* Desktop collapse - hidden on mobile */}
        <Tooltip title={sidebarCollapsed ? "Buka sidebar" : "Ciutkan sidebar"}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? (
              <RightOutlined className="text-lg" />
            ) : (
              <LeftOutlined className="text-lg" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <Tooltip title={darkMode ? "Mode Terang" : "Mode Gelap"}>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            {darkMode ? (
              <SunOutlined className="text-lg" />
            ) : (
              <MoonOutlined className="text-lg" />
            )}
          </button>
        </Tooltip>

        {/* Notification bell */}
        <Tooltip title="Notifikasi">
          <Badge count={0} size="small">
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
            >
              <BellOutlined className="text-lg" />
            </button>
          </Badge>
        </Tooltip>

        {/* User avatar */}
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === "logout") handleLogout();
              if (key === "change-password") router.push("/settings");
            },
          }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <button
            type="button"
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Avatar
              icon={<UserOutlined />}
              className="!bg-gradient-to-br !from-blue-500 !to-indigo-600 !flex items-center justify-center"
              size={32}
            />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                {session?.user?.name ?? "User"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {session?.user?.role}
              </div>
            </div>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
