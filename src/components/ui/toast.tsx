"use client";

import { App } from "antd";

export function useToast() {
  const { message, notification } = App.useApp();

  return {
    success: (msg: string) => message.success(msg),
    error: (msg: string) => message.error(msg),
    warning: (msg: string) => message.warning(msg),
    info: (msg: string) => message.info(msg),
    notify: (title: string, desc?: string) =>
      notification.info({ message: title, description: desc }),
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return children;
}
