"use client";

import { Drawer as AntDrawer } from "antd";
import type { DrawerProps } from "antd";

export type AppDrawerProps = DrawerProps & {
  loading?: boolean;
};

export function AppDrawer({ loading, children, ...props }: AppDrawerProps) {
  return (
    <AntDrawer
      destroyOnHidden
      loading={loading}
      {...props}
    >
      {children}
    </AntDrawer>
  );
}
