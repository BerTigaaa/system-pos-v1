"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Typography, Alert, Divider } from "antd";
import { MailOutlined, LockOutlined, ShopOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values: { email: string; password: string }) {
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
    <div className="text-center">
      <div className="mb-6">
        <ShopOutlined className="text-4xl text-blue-600 mb-2" />
        <Title level={3} className="!mb-1">
          BertigaPos
        </Title>
        <Text type="secondary">Masuk ke akun Anda</Text>
      </div>

      <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Email wajib diisi" },
            { type: "email", message: "Email tidak valid" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="admin@bertigapos.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Password wajib diisi" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>

        {error && (
          <Alert message={error} type="error" showIcon className="mb-4" />
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            Masuk
          </Button>
        </Form.Item>
      </Form>

      <Divider plain>
        <Text type="secondary" className="text-xs">
          atau
        </Text>
      </Divider>

      <Text type="secondary">
        Belum punya akun?{" "}
        <Link href="/register" className="text-blue-600">
          Daftar Trial Gratis
        </Link>
      </Text>
    </div>
  );
}
