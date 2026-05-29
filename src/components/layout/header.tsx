"use client";

import { useCallback, useState, useEffect } from "react";
import { Dropdown, Avatar, Badge, Tooltip, Button, Popover } from "antd";
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
  InfoCircleOutlined,
} from "@ant-design/icons";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/features/notifications/actions";

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

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifList, setNotifList] = useState<{ id: string; title: string; message: string; isRead: boolean; createdAt: Date }[]>([]);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);

  async function loadUnread() {
    const [countRes, notifRes] = await Promise.all([
      getUnreadCount(),
      getNotifications(1, 5),
    ]);
    if (countRes.success) setUnreadCount(countRes.count);
    if (notifRes.success) setNotifList(notifRes.data as typeof notifList);
  }

  useEffect(() => {
    loadUnread();
    const es = new EventSource("/api/notifications/stream");
    es.addEventListener("refresh", loadUnread);
    es.addEventListener("connected", loadUnread);
    return () => es.close();
  }, []);

  async function handleMarkAll() {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifList((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleMarkOne(id: string) {
    await markAsRead(id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

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

  const notifContent = (
    <div className="w-80 max-h-96 overflow-y-auto">
      {notifList.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <InfoCircleOutlined className="text-2xl mb-2" />
          <p className="text-sm">Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {notifList.map((item) => (
            <div
              key={item.id}
              className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!item.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
              onClick={() => handleMarkOne(item.id)}
            >
              <div className="flex items-center gap-2">
                {!item.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                <span className={`text-sm ${item.isRead ? "font-medium text-gray-700 dark:text-gray-300" : "font-semibold text-gray-900 dark:text-white"}`}>
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.message}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                {new Date(item.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      )}
      {notifList.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-2 flex justify-between">
          <Button type="link" size="small" onClick={handleMarkAll}>
            Tandai semua dibaca
          </Button>
          <Button type="link" size="small" onClick={() => { router.push("/notifications"); setNotifPopoverOpen(false); }}>
            Lihat Semua
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
        >
          <MenuOutlined className="text-lg" />
        </button>

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

        <Popover
          content={notifContent}
          trigger="click"
          open={notifPopoverOpen}
          onOpenChange={setNotifPopoverOpen}
          placement="bottomRight"
        >
          <Tooltip title="Notifikasi">
            <Badge count={unreadCount} size="small">
              <button
                type="button"
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
              >
                <BellOutlined className="text-lg" />
              </button>
            </Badge>
          </Tooltip>
        </Popover>

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
