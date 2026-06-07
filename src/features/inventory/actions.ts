"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions-db";

export async function getMovements(params: {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 10 };
  if (!await hasPermissionAsync(session.user.role, "inventory", "view"))
    return { success: false, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 10 };

  const { search, type, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      productSku: m.product.sku,
      type: m.type,
      quantity: m.quantity,
      stockBefore: m.stockBefore,
      stockAfter: m.stockAfter,
      reason: m.reason,
      notes: m.notes,
      userName: m.user.name,
      createdAt: m.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getStockOpnameList(params: { page?: number; pageSize?: number }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 10 };
  if (!await hasPermissionAsync(session.user.role, "inventory", "view"))
    return { success: false, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 10 };

  const { page = 1, pageSize = 10 } = params;

  const [data, total] = await Promise.all([
    prisma.stockOpname.findMany({
      include: {
        user: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockOpname.count(),
  ]);

  return { success: true, data, total, page, pageSize };
}
