"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions-db";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: null };
  if (!await hasPermissionAsync(session.user.role, "dashboard", "view"))
    return { success: false, error: { message: "Forbidden" }, data: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const role = session.user.role;
  const cashierFilter = role === "CASHIER" ? { cashierId: session.user.id } : {};

  const [todayTransactions, todaySalesAgg, totalProducts, lowStockProducts] =
    await Promise.all([
      prisma.transaction.count({
        where: { createdAt: { gte: today, lt: tomorrow }, ...cashierFilter },
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, status: "COMPLETED", ...cashierFilter },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      prisma.$queryRawUnsafe<{ id: string; name: string; sku: string; stock: number; min_stock: number }[]>(
        `SELECT id, name, sku, stock, min_stock FROM products WHERE deleted_at IS NULL AND is_active = true AND stock <= min_stock ORDER BY stock ASC LIMIT 10`
      ),
    ]);

  const totalSales = Number(todaySalesAgg._sum.total ?? 0);
  const avgTransaction = todayTransactions > 0 ? Math.round(totalSales / todayTransactions) : 0;

  return {
    success: true,
    data: {
      todayTransactions,
      totalSales,
      avgTransaction,
      totalProducts,
      lowStockList: lowStockProducts,
    },
  };
}

export async function getSalesChart(days = 7) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days + 1);

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: startDate }, status: "COMPLETED" },
    select: { createdAt: true, total: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    const key = t.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(key) ?? { total: 0, count: 0 };
    existing.total += Number(t.total);
    existing.count++;
    dailyMap.set(key, existing);
  }

  const fmt = new Intl.DateTimeFormat("id", { weekday: "short", day: "numeric" });
  const data: { date: string; total: number; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const val = dailyMap.get(key) ?? { total: 0, count: 0 };
    data.push({ date: fmt.format(d), total: val.total, count: val.count });
  }

  return { success: true, data };
}

export async function getRecentTransactions(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: null };

  const where =
    session.user.role === "CASHIER" ? { cashierId: session.user.id } : {};

  const data = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      cashier: { select: { name: true } },
    },
  });

  return {
    success: true,
    data: data.map((t) => ({
      ...t,
      subtotal: Number(t.subtotal),
      discountAmount: Number(t.discountAmount),
      taxPercent: Number(t.taxPercent),
      taxAmount: Number(t.taxAmount),
      total: Number(t.total),
    })),
  };
}
