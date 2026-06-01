"use client";

import { signOut } from "next-auth/react";
import { Typography, Button, Result, Space } from "antd";
import { LogoutOutlined, WhatsAppOutlined } from "@ant-design/icons";

const { Text } = Typography;
const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";

export default function TrialExpiredPage() {
  return (
    <Result
      status="warning"
      title="Masa Trial Berakhir"
      subTitle="Masa trial akun Anda telah berakhir. Silakan hubungi kami via WhatsApp untuk perpanjangan akun."
      extra={
        <Space direction="vertical" size="middle">
          <Button
            type="primary"
            size="large"
            icon={<WhatsAppOutlined />}
            className="!bg-[#25D366] !border-[#25D366] hover:!bg-[#1da851] !rounded-full !h-11 !px-6 !font-semibold"
            href={`https://wa.me/${waNumber}?text=Halo%20saya%20ingin%20memperpanjang%20akun%20BertigaPos`}
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
