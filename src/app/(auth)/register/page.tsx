"use client";

import { Typography, Button, Result } from "antd";
import { WhatsAppOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Text } = Typography;

const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";

export default function RegisterPage() {
  return (
    <Result
      status="info"
      icon={<WhatsAppOutlined style={{ color: "#25D366" }} />}
      title="Coba BertigaPos"
      subTitle={
        <div className="space-y-2">
          <p>
            Klik tombol di bawah untuk hubungi kami via WhatsApp.
            Kami akan bantu buatkan akun trial untuk Anda.
          </p>
          <Text className="!text-xs !text-gray-400 block">
            Tim kami akan merespon dalam 1×24 jam pada jam kerja.
          </Text>
        </div>
      }
      extra={[
        <Button
          key="wa"
          type="primary"
          size="large"
          icon={<WhatsAppOutlined />}
          className="!bg-[#25D366] !border-[#25D366] hover:!bg-[#1da851] !rounded-full !h-12 !px-8 !font-semibold !shadow-lg !shadow-green-500/20"
          href={`https://wa.me/${waNumber}?text=Halo%20saya%20ingin%20mencoba%20BertigaPos`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Hubungi via WhatsApp
        </Button>,
        <Link key="back" href="/login">
          <Button icon={<ArrowLeftOutlined />} type="text">
            Kembali ke Login
          </Button>
        </Link>,
      ]}
    />
  );
}
