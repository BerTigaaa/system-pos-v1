"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log";
import { notifyRole } from "@/lib/notifications";
import type { UserRole } from "@prisma/client";

export async function getAdminStats() {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "admin", "view"))
    return { success: false as const, error: { message: "Forbidden" } };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    totalProducts,
    totalTransactions,
    todayTransactions,
    todayRevenue,
    totalRefunds,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.transaction.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: today, lt: tomorrow }, status: { not: "CANCELLED" } },
    }),
    prisma.refund.count(),
  ]);

  return {
    success: true as const,
    data: {
      totalUsers,
      totalProducts,
      totalTransactions,
      todayTransactions,
      todayRevenue: Number(todayRevenue._sum.total ?? 0),
      totalRefunds,
    },
  };
}

export async function getUsers(params: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "admin", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 20 };

  const { search, role, status, page = 1, pageSize = 20 } = params;

  const where: Record<string, unknown> = {};
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
  if (role) where.role = role;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { success: true as const, data, total, page, pageSize };
}

export async function toggleUserStatus(userId: string) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "admin", "edit"))
    return { success: false as const, error: { message: "Forbidden" } };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
  if (!user) return { success: false as const, error: { message: "User not found" } };

  const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.user.update({ where: { id: userId }, data: { status: newStatus } });

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const targetName = targetUser?.name ?? userId;

  await createAuditLog({
    userId: session.user.id,
    action: newStatus === "ACTIVE" ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    module: "admin",
    description: `${newStatus === "ACTIVE" ? "Mengaktifkan" : "Menonaktifkan"} akun: ${targetName}`,
  });

  await notifyRole(["OWNER", "SUPER_ADMIN"], {
    type: "USER_STATUS_CHANGED",
    title: "Status Pengguna Diubah",
    message: `Akun ${targetName} telah ${newStatus === "ACTIVE" ? "diaktifkan" : "dinonaktifkan"}.`,
    data: { userId, newStatus },
  });

  return { success: true as const, data: { status: newStatus } };
}

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "admin", "edit"))
    return { success: false as const, error: { message: "Forbidden" } };

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const targetName = targetUser?.name ?? userId;

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE_USER_ROLE",
    module: "admin",
    description: `Mengubah hak akses ${targetName} menjadi ${role}`,
  });

  await notifyRole(["OWNER", "SUPER_ADMIN"], {
    type: "USER_ROLE_CHANGED",
    title: "Role Pengguna Diubah",
    message: `Hak akses ${targetName} diubah menjadi ${role}.`,
    data: { userId, newRole: role },
  });

  return { success: true as const };
}

export async function getSystemInfo() {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "admin", "view"))
    return { success: false as const, error: { message: "Forbidden" } };

  const [userCount, activeSessions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    success: true as const,
    data: {
      node: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      database: "PostgreSQL 18",
      userCount,
      activeSessions,
      lastMigration: "Phase 3",
    },
  };
}
