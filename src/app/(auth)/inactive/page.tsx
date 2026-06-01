"use client";

import { signOut } from "next-auth/react";
import { Button, Result, Space } from "antd";
import { LogoutOutlined, WhatsAppOutlined } from "@ant-design/icons";

const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";

export default function InactivePage() {
  return (
    <Result
      status="error"
      title="Akun Tidak Aktif"
      subTitle="Akun Anda sedang tidak aktif. Silakan hubungi kami via WhatsApp untuk informasi lebih lanjut."
      extra={
        <Space direction="vertical" size="middle">
          <Button
            type="primary"
            size="large"
            icon={<WhatsAppOutlined />}
            className="!bg-[#25D366] !border-[#25D366] hover:!bg-[#1da851] !rounded-full !h-11 !px-6 !font-semibold"
            href={`https://wa.me/${waNumber}?text=Halo%20saya%20ingin%20menanyakan%20akun%20BertigaPos`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Hubungi via WhatsApp
          </Button>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Kembali ke Login
          </Button>
        </Space>
      }
    />
  );
}
