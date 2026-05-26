"use client";

import { ConfigProvider, App as AntApp, theme } from "antd";
import { lightTheme, darkTheme } from "@/lib/theme";
import { SessionProvider } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";

function AntConfig({ children }: { children: React.ReactNode }) {
  const darkMode = useUIStore((s) => s.darkMode);

  return (
    <ConfigProvider
      theme={{
        ...(darkMode ? darkTheme : lightTheme),
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AntConfig>{children}</AntConfig>
    </SessionProvider>
  );
}
