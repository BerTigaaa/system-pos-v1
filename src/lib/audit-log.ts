import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { headers } from "next/headers";

export async function getClientIp(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

export async function createAuditLog(params: {
  userId?: string | null;
  action: string;
  module: string;
  description: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string;
}) {
  let ip = params.ipAddress;
  if (!ip) {
    const clientIp = await getClientIp();
    if (clientIp) ip = clientIp;
  }

  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      module: params.module,
      description: params.description,
      oldData: (params.oldData ?? null) as unknown as Prisma.InputJsonValue,
      newData: (params.newData ?? null) as unknown as Prisma.InputJsonValue,
      ipAddress: ip,
      userAgent: params.userAgent ?? null,
    },
  });
}
