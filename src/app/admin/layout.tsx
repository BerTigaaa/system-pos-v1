"use client";

import { Layout, Typography } from "antd";

const { Header, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout className="!min-h-screen">
      <Header className="!bg-gray-900 !px-6 flex items-center">
        <Title level={4} className="!text-white !mb-0">
          Admin Panel
        </Title>
      </Header>
      <Content className="!p-6 !bg-gray-50">{children}</Content>
    </Layout>
  );
}
