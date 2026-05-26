"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useUIStore } from "@/store/ui-store";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isDesktop;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, darkMode } = useUIStore();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const marginLeft = isDesktop ? (sidebarCollapsed ? 80 : 240) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar />
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ marginLeft }}
      >
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
