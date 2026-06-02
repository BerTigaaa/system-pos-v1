"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions-db";
import { Prisma } from "@prisma/client";

export async function getAuditLogs(params: {
  userId?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 20 };

  if (!await hasPermissionAsync(session.user.role, "audit", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 20 };

  const { userId, module, dateFrom, dateTo, search, page = 1, pageSize = 20 } = params;

  const where: Prisma.AuditLogWhereInput = {};

  if (userId) where.userId = userId;
  if (module) where.module = module;
  if (search) {
    where.description = { contains: search, mode: "insensitive" };
  }
  if (dateFrom || dateTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
    where.createdAt = createdAt;
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    success: true as const,
    data: data.map((d) => ({
      id: d.id,
      user: d.user ? { id: d.user.id, name: d.user.name, email: d.user.email } : null,
      action: d.action,
      module: d.module,
      description: d.description,
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
      createdAt: d.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getAuditLogModules() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" }, data: [] };
  if (!await hasPermissionAsync(session.user.role, "audit", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: [] };

  const modules = await prisma.auditLog.groupBy({
    by: ["module"],
    orderBy: { module: "asc" },
  });
  return { success: true as const, data: modules.map((m) => m.module) };
}
