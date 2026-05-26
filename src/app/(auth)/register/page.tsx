"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Typography, Alert, Divider } from "antd";
import {
  ShopOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
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
    <div className="text-center">
      <div className="mb-6">
        <ShopOutlined className="text-4xl text-blue-600 mb-2" />
        <Title level={3} className="!mb-1">
          Daftar Trial
        </Title>
        <Text type="secondary">Coba BertigaPos gratis 14 hari</Text>
      </div>

      <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Form.Item
          name="businessName"
          rules={[{ required: true, message: "Nama usaha wajib diisi" }]}
        >
          <Input prefix={<ShopOutlined />} placeholder="Nama Usaha" size="large" />
        </Form.Item>

        <Form.Item
          name="ownerName"
          rules={[{ required: true, message: "Nama owner wajib diisi" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Nama Owner" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Email wajib diisi" },
            { type: "email", message: "Email tidak valid" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[
            { required: true, message: "Telepon wajib diisi" },
            { min: 10, message: "Minimal 10 digit" },
          ]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="Telepon" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Password wajib diisi" },
            { min: 6, message: "Minimal 6 karakter" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          rules={[
            { required: true, message: "Konfirmasi password wajib diisi" },
            { min: 6, message: "Minimal 6 karakter" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Konfirmasi Password"
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
            Daftar Trial Gratis
          </Button>
        </Form.Item>
      </Form>

      <Divider plain />

      <Text type="secondary">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-blue-600">
          Masuk
        </Link>
      </Text>
    </div>
  );
}
