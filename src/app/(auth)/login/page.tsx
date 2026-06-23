"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Typography, Checkbox } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const registered = searchParams.get("registered");

  async function handleSubmit(values: { email: string; password: string; remember?: boolean }) {
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      {registered && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <svg className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 110 14A7 7 0 018 1zm3.36 5.14a.5.5 0 00-.7-.02L7.3 9.48 5.3 7.46a.5.5 0 10-.7.72l2.36 2.36a.5.5 0 00.7 0l3.7-3.7a.5.5 0 00-.01-.7z"/></svg>
          <span className="text-sm text-emerald-700 dark:text-emerald-300">Pendaftaran berhasil! Silakan masuk dengan akun Anda.</span>
        </div>
      )}

      <div className="mb-8">
        <Title level={2} className="!mb-1 !text-2xl">
          Selamat Datang
        </Title>
        <Text className="!text-gray-500 dark:!text-gray-400">
          Masuk ke akun BertigaPos Anda
        </Text>
      </div>

      <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" requiredMark={false}>
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
            placeholder="admin@bertigapos.com"
            size="large"
            className="!rounded-lg"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Password wajib diisi" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="!text-gray-400" />}
            placeholder="Masukkan password"
            size="large"
            className="!rounded-lg"
          />
        </Form.Item>

        <div className="flex items-center justify-between mb-4">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="!text-sm !text-gray-500">Ingat saya</Checkbox>
          </Form.Item>
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Lupa password?
          </Link>
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
            Masuk
          </Button>
        </Form.Item>
      </Form>


    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
