import { prisma } from "./prisma";
import type { NotificationType, UserRole, Prisma } from "@prisma/client";

type NotifInput = {
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

export async function notifyRole(roles: UserRole[], notification: NotifInput) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true },
  });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, ...notification })),
  });
}

export async function notifyUser(userId: string, notification: NotifInput) {
  await prisma.notification.create({
    data: { userId, ...notification },
  });
}
