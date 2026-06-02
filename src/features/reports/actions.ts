"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions-db";
import { reportPeriodSchema } from "./types";
import { Prisma } from "@prisma/client";

export async function getDailySales(date?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false as const, error: { message: "Unauthorized" }, data: [] };
    if (!await hasPermissionAsync(session.user.role, "reports", "view"))
      return { success: false as const, error: { message: "Forbidden" }, data: [] };

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: targetDate, lt: nextDay },
      },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "asc" },
    });

    const hourlyMap = new Map<
      number,
      { transactionCount: number; totalRevenue: number; totalItems: number }
    >();

    for (const t of transactions) {
      const hour = t.createdAt.getHours();
      const existing = hourlyMap.get(hour) ?? {
        transactionCount: 0,
        totalRevenue: 0,
        totalItems: 0,
      };
      existing.transactionCount++;
      existing.totalRevenue += Number(t.total);
      existing.totalItems += t._count.items;
      hourlyMap.set(hour, existing);
    }

    const data = Array.from(hourlyMap.entries())
      .map(([hour, val]) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        transactionCount: val.transactionCount,
        totalRevenue: val.totalRevenue,
        totalItems: val.totalItems,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return { success: true as const, data };
  } catch (err) {
    console.error("getDailySales error:", err);
    return { success: false as const, error: { message: "Gagal memuat laporan harian" }, data: [] };
  }
}

export async function getMonthlySales(month?: number, year?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false as const, error: { message: "Unauthorized" }, data: [] };
    if (!await hasPermissionAsync(session.user.role, "reports", "view"))
      return { success: false as const, error: { message: "Forbidden" }, data: [] };

    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfMonth, lt: endOfMonth },
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<
      number,
      { transactionCount: number; totalRevenue: number }
    >();

    for (const t of transactions) {
      const day = t.createdAt.getDate();
      const existing = dailyMap.get(day) ?? {
        transactionCount: 0,
        totalRevenue: 0,
      };
      existing.transactionCount++;
      existing.totalRevenue += Number(t.total);
      dailyMap.set(day, existing);
    }

    const data = Array.from(dailyMap.entries())
      .map(([day, val]) => ({
        day,
        date: `${targetYear}-${targetMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
        transactionCount: val.transactionCount,
        totalRevenue: val.totalRevenue,
      }))
      .sort((a, b) => a.day - b.day);

    return { success: true as const, data };
  } catch (err) {
    console.error("getMonthlySales error:", err);
    return { success: false as const, error: { message: "Gagal memuat laporan bulanan" }, data: [] };
  }
}

export async function getYearlySales(year?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false as const, error: { message: "Unauthorized" }, data: [] };
    if (!await hasPermissionAsync(session.user.role, "reports", "view"))
      return { success: false as const, error: { message: "Forbidden" }, data: [] };

    const targetYear = year ?? new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear + 1, 0, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfYear, lt: endOfYear },
      },
      orderBy: { createdAt: "asc" },
    });

    const monthlyMap = new Map<
      number,
      { transactionCount: number; totalRevenue: number }
    >();

    for (const t of transactions) {
      const month = t.createdAt.getMonth() + 1;
      const existing = monthlyMap.get(month) ?? {
        transactionCount: 0,
        totalRevenue: 0,
      };
      existing.transactionCount++;
      existing.totalRevenue += Number(t.total);
      monthlyMap.set(month, existing);
    }

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];

    const data = Array.from(monthlyMap.entries())
      .map(([month, val]) => ({
        month,
        monthName: monthNames[month - 1],
        transactionCount: val.transactionCount,
        totalRevenue: val.totalRevenue,
      }))
      .sort((a, b) => a.month - b.month);

    return { success: true as const, data };
  } catch (err) {
    console.error("getYearlySales error:", err);
    return { success: false as const, error: { message: "Gagal memuat laporan tahunan" }, data: [] };
  }
}

export async function getTopProducts(params: {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false as const, error: { message: "Unauthorized" }, data: [] };
    if (!await hasPermissionAsync(session.user.role, "reports", "view"))
      return { success: false as const, error: { message: "Forbidden" }, data: [] };

    const where: Prisma.TransactionWhereInput = { status: "COMPLETED" };
    if (params.dateFrom || params.dateTo) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (params.dateFrom) createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) createdAt.lte = new Date(params.dateTo + "T23:59:59.999Z");
      where.createdAt = createdAt;
    }
    if (params.categoryId) {
      where.items = { some: { product: { categoryId: params.categoryId } } };
    }

    const items = await prisma.transactionItem.findMany({
      where: { transaction: where },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        sellPrice: true,
        buyPrice: true,
        product: { select: { category: { select: { name: true } } } },
      },
    });

    const productMap = new Map<
      string,
      {
        productName: string;
        categoryName: string | null;
        totalQuantity: number;
        totalRevenue: number;
        totalBuyPrice: number;
      }
    >();

    for (const item of items) {
      const existing = productMap.get(item.productId) ?? {
        productName: item.productName,
        categoryName: item.product.category?.name ?? null,
        totalQuantity: 0,
        totalRevenue: 0,
        totalBuyPrice: 0,
      };
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += Number(item.sellPrice) * item.quantity;
      existing.totalBuyPrice += Number(item.buyPrice) * item.quantity;
      productMap.set(item.productId, existing);
    }

    const limit = params.limit ?? 20;
    const data = Array.from(productMap.entries())
      .map(([productId, val]) => ({
        productId,
        productName: val.productName,
        categoryName: val.categoryName,
        totalQuantity: val.totalQuantity,
        totalRevenue: val.totalRevenue,
        totalBuyPrice: val.totalBuyPrice,
        grossProfit: val.totalRevenue - val.totalBuyPrice,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return { success: true as const, data };
  } catch (err) {
    console.error("getTopProducts error:", err);
    return { success: false as const, error: { message: "Gagal memuat produk terlaris" }, data: [] };
  }
}

export async function getStockReport(categoryId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false as const, error: { message: "Unauthorized" }, data: [] };
    if (!await hasPermissionAsync(session.user.role, "reports", "view"))
      return { success: false as const, error: { message: "Forbidden" }, data: [] };

    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    const data = products.map((p) => {
      const stock = p.stock;
      const minStock = p.minStock;
      let status: "in_stock" | "low" | "out";
      if (stock <= 0) status = "out";
      else if (stock <= minStock) status = "low";
      else status = "in_stock";

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name ?? null,
        stock,
        minStock,
        buyPrice: Number(p.buyPrice),
        sellPrice: Number(p.sellPrice),
        status,
      };
    });

    return { success: true as const, data };
  } catch (err) {
    console.error("getStockReport error:", err);
    return { success: false as const, error: { message: "Gagal memuat laporan stok" }, data: [] };
  }
}

export async function getCashierReport(params: {
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false as const, error: { message: "Unauthorized" }, data: [] };
    if (!await hasPermissionAsync(session.user.role, "reports", "view"))
      return { success: false as const, error: { message: "Forbidden" }, data: [] };

    const where: Prisma.TransactionWhereInput = { status: "COMPLETED" };
    if (params.cashierId) where.cashierId = params.cashierId;
    if (params.dateFrom || params.dateTo) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (params.dateFrom) createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) createdAt.lte = new Date(params.dateTo + "T23:59:59.999Z");
      where.createdAt = createdAt;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { cashier: { select: { id: true, name: true } } },
    });

    const cashierMap = new Map<
      string,
      { name: string; transactions: number; revenue: number }
    >();

    for (const t of transactions) {
      const existing = cashierMap.get(t.cashier.id) ?? {
        name: t.cashier.name,
        transactions: 0,
        revenue: 0,
      };
      existing.transactions++;
      existing.revenue += Number(t.total);
      cashierMap.set(t.cashier.id, existing);
    }

    const data = Array.from(cashierMap.entries()).map(([cashierId, val]) => ({
      cashierId,
      cashierName: val.name,
      totalShifts: 0,
      totalTransactions: val.transactions,
      totalRevenue: val.revenue,
    }));

    return { success: true as const, data };
  } catch (err) {
    console.error("getCashierReport error:", err);
    return { success: false as const, error: { message: "Gagal memuat laporan kasir" }, data: [] };
  }
}

export async function exportReport(params: {
  type: string;
  format: "xlsx" | "pdf";
  date?: string;
  month?: number;
  year?: number;
  categoryId?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: { message: "Unauthorized" } };

  if (!await hasPermissionAsync(session.user.role, "reports", "manage"))
    return { success: false as const, error: { message: "Forbidden" } };

  let rows: Record<string, unknown>[] = [];
  let title = "";

  const { type, format, date, month, year, categoryId, cashierId, dateFrom, dateTo } = params;

  if (type === "daily" && date) {
    const res = await getDailySales(date);
    if (res.success) {
      title = `Penjualan Harian - ${date}`;
      rows = res.data.map((r) => ({
        Jam: r.hour,
        Transaksi: r.transactionCount,
        "Total Item": r.totalItems,
        Pendapatan: r.totalRevenue,
      }));
    }
  } else if (type === "monthly" && month && year) {
    const res = await getMonthlySales(month, year);
    if (res.success) {
      title = `Penjualan Bulanan - ${month}/${year}`;
      rows = res.data.map((r) => ({
        Tanggal: r.date,
        Transaksi: r.transactionCount,
        Pendapatan: r.totalRevenue,
      }));
    }
  } else if (type === "yearly" && year) {
    const res = await getYearlySales(year);
    if (res.success) {
      title = `Penjualan Tahunan - ${year}`;
      rows = res.data.map((r) => ({
        Bulan: r.monthName,
        Transaksi: r.transactionCount,
        Pendapatan: r.totalRevenue,
      }));
    }
  } else if (type === "top-products") {
    const res = await getTopProducts({ dateFrom, dateTo, categoryId, limit: 50 });
    if (res.success) {
      title = "Produk Terlaris";
      rows = res.data.map((r) => ({
        Produk: r.productName,
        Kategori: r.categoryName ?? "-",
        Terjual: r.totalQuantity,
        Revenue: r.totalRevenue,
        "Laba Kotor": r.grossProfit,
      }));
    }
  } else if (type === "stock") {
    const res = await getStockReport(categoryId);
    if (res.success) {
      title = "Laporan Stok";
      rows = res.data.map((r) => ({
        Produk: r.name,
        SKU: r.sku,
        Kategori: r.categoryName ?? "-",
        Stok: r.stock,
        "Min Stok": r.minStock,
        "Harga Beli": r.buyPrice,
        "Harga Jual": r.sellPrice,
      }));
    }
  } else if (type === "cashier") {
    const res = await getCashierReport({ cashierId, dateFrom, dateTo });
    if (res.success) {
      title = "Laporan Kasir";
      rows = res.data.map((r) => ({
        Kasir: r.cashierName,
        Transaksi: r.totalTransactions,
        Pendapatan: r.totalRevenue,
      }));
    }
  }

  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return {
      success: true as const,
      data: {
        buffer: Array.from(new Uint8Array(buf)),
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
      },
    };
  } else {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));
      autoTable(doc, {
        head: [headers],
        body,
        startY: 20,
        styles: { fontSize: 8 },
      });
    }
    return {
      success: true as const,
      data: {
        buffer: Array.from(new Uint8Array(doc.output("arraybuffer"))),
        contentType: "application/pdf",
        extension: "pdf",
      },
    };
  }
}
