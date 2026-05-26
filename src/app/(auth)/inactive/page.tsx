"use client";

import { signOut } from "next-auth/react";
import { Button, Result } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

export default function InactivePage() {
  return (
    <Result
      status="error"
      title="Akun Tidak Aktif"
      subTitle="Akun Anda sedang tidak aktif. Silakan hubungi developer untuk informasi lebih lanjut."
      extra={
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Kembali ke Login
        </Button>
      }
    />
  );
}
