"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getNotifications(page = 1, pageSize = 10) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: { message: "Unauthorized" }, data: [], total: 0 };

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId: session.user.id } }),
  ]);

  return {
    success: true as const,
    data: data.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      data: n.data,
      createdAt: n.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" }, count: 0 };

  const count = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return { success: true as const, count };
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };

  await prisma.notification.update({
    where: { id, userId: session.user.id },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true as const };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true as const };
}

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };

  await prisma.notification.create({ data: data as Parameters<typeof prisma.notification.create>[0]["data"] });
  return { success: true as const };
}
