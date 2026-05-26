"use client";

import { Typography, Card } from "antd";

const { Text } = Typography;

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard Admin</h1>
      <p className="text-gray-500 mb-6">Statistik sistem</p>
      <Card>
        <Text>Selamat datang di panel admin BertigaPos.</Text>
      </Card>
    </div>
  );
}
