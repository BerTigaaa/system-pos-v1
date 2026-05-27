"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Typography, Divider } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { registerTrial } from "@/features/auth/actions";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values: {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) {
    setError("");
    setLoading(true);

    if (values.password !== values.confirmPassword) {
      setError("Password tidak cocok");
      setLoading(false);
      return;
    }

    const form = new FormData();
    form.append("businessName", values.businessName);
    form.append("ownerName", values.ownerName);
    form.append("email", values.email);
    form.append("phone", values.phone);
    form.append("password", values.password);
    form.append("confirmPassword", values.confirmPassword);

    const result = await registerTrial(form);

    if (!result.success) {
      setError(result.error?.message ?? "Terjadi kesalahan");
      setLoading(false);
      return;
    }

    router.push("/login?registered=true");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-8">
        <Title level={2} className="!mb-1 !text-2xl">
          Mulai Trial Gratis
        </Title>
        <Text className="!text-gray-500 dark:!text-gray-400">
          Coba BertigaPos gratis 14 hari, tanpa kartu kredit
        </Text>
      </div>

      <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" requiredMark={false}>
        <div className="flex gap-4">
          <Form.Item
            name="businessName"
            label="Nama Usaha"
            className="flex-1"
            rules={[{ required: true, message: "Nama usaha wajib diisi" }]}
          >
            <Input
              prefix={<ShopOutlined className="!text-gray-400" />}
              placeholder="Toko Maju Jaya"
              size="large"
              className="!rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="ownerName"
            label="Nama Owner"
            className="flex-1"
            rules={[{ required: true, message: "Nama owner wajib diisi" }]}
          >
            <Input
              prefix={<UserOutlined className="!text-gray-400" />}
              placeholder="Budi Santoso"
              size="large"
              className="!rounded-lg"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Email wajib diisi" },
            { type: "email", message: "Email tidak valid" },
          ]}
        >
          <Input
            prefix={<MailOutlined className="!text-gray-400" />}
            placeholder="budi@example.com"
            size="large"
            className="!rounded-lg"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Telepon"
          rules={[
            { required: true, message: "Telepon wajib diisi" },
            { min: 10, message: "Minimal 10 digit" },
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="!text-gray-400" />}
            placeholder="081234567890"
            size="large"
            className="!rounded-lg"
          />
        </Form.Item>

        <div className="flex gap-4">
          <Form.Item
            name="password"
            label="Password"
            className="flex-1"
            rules={[
              { required: true, message: "Password wajib diisi" },
              { min: 6, message: "Minimal 6 karakter" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="!text-gray-400" />}
              placeholder="Min. 6 karakter"
              size="large"
              className="!rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Konfirmasi"
            className="flex-1"
            rules={[
              { required: true, message: "Konfirmasi wajib diisi" },
              { min: 6, message: "Minimal 6 karakter" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="!text-gray-400" />}
              placeholder="Ulangi password"
              size="large"
              className="!rounded-lg"
            />
          </Form.Item>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <svg className="w-4 h-4 mt-0.5 text-red-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 110 14A7 7 0 018 1zM7.25 5v3.5h1.5V5h-1.5zm0 4.5v1.5h1.5V9.5h-1.5z"/></svg>
            <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} className="text-red-400 hover:text-red-600 dark:hover:text-red-200 cursor-pointer">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
            </button>
          </div>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!rounded-lg !font-semibold !shadow-md !shadow-blue-500/20 hover:!shadow-lg hover:!shadow-blue-500/30 transition-shadow"
          >
            Buat Akun Trial Gratis
          </Button>
        </Form.Item>

        <Text className="!text-xs !text-gray-400 block text-center">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Syarat & Ketentuan</Link>{" "}
          dan{" "}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Kebijakan Privasi</Link>
        </Text>
      </Form>

      <Divider plain className="!text-gray-300 dark:!text-gray-600 !text-xs">
        atau daftar dengan
      </Divider>

      <div className="flex gap-3">
        <Button block size="large" className="!rounded-lg !flex items-center justify-center !gap-2 !text-gray-600 dark:!text-gray-300">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </Button>
        <Button block size="large" className="!rounded-lg !flex items-center justify-center !gap-2 !text-gray-600 dark:!text-gray-300">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          GitHub
        </Button>
      </div>

      <div className="mt-8 text-center">
        <Text className="!text-sm !text-gray-500 dark:!text-gray-400">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            Masuk
          </Link>
        </Text>
      </div>
    </div>
  );
}
