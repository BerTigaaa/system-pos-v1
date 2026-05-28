"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: null };

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

  return {
    success: true,
    data: {
      todayTransactions,
      totalSales,
      totalProducts,
      lowStockList: lowStockProducts,
    },
  };
}

export async function getSalesChart(days = 7) {
  const data: { date: string; total: number; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const agg = await prisma.transaction.aggregate({
      where: { createdAt: { gte: d, lt: next }, status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    });

    data.push({
      date: d.toLocaleDateString("id", { weekday: "short", day: "numeric" }),
      total: Number(agg._sum.total ?? 0),
      count: agg._count,
    });
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
