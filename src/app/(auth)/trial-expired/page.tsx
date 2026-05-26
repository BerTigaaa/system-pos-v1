"use client";

import { signOut } from "next-auth/react";
import { Typography, Button, Result } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function TrialExpiredPage() {
  return (
    <Result
      status="warning"
      title="Masa Trial Berakhir"
      subTitle="Masa trial akun Anda telah berakhir. Silakan hubungi developer untuk aktivasi akun."
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
