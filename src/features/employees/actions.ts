"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { notifyRole } from "@/lib/notifications";
import { getClientIp } from "@/lib/audit-log";
import { employeeFormSchema } from "./types";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function getEmployees(params?: { search?: string; role?: string; status?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" }, data: [], total: 0 };
  if (!hasPermission(session.user.role, "employees", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: [], total: 0 };

  const where: Prisma.UserWhereInput = {};
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params?.role) where.role = params.role as Prisma.EnumUserRoleFilter;
  if (params?.status) where.status = params.status as Prisma.EnumAccountStatusFilter;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { success: true as const, data, total };
}

export async function createEmployee(formData: EmployeeFormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "employees", "create"))
    return { success: false as const, error: { message: "Forbidden" } };

  const parsed = employeeFormSchema.safeParse(formData);
  if (!parsed.success)
    return { success: false as const, error: { message: parsed.error.issues[0].message } };

  const { name, email, password, role, phone } = parsed.data;

  if (!password) return { success: false as const, error: { message: "Password wajib diisi untuk karyawan baru" } };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { success: false as const, error: { message: "Email sudah digunakan" } };

  const hashed = await bcrypt.hash(password, 10);
  const clientIp = await getClientIp();

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: { name, email, password: hashed, role, phone: phone || null, status: "ACTIVE" },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_CREATED",
        module: "employees",
        description: `Tambah karyawan: ${name} (${email}) sebagai ${role}`,
        newData: { name, email, role },
        ipAddress: clientIp,
      },
    });
  });

  await notifyRole(["OWNER"], {
    type: "EMPLOYEE_CREATED",
    title: "Karyawan Baru",
    message: `Karyawan baru: ${name} (${email}) sebagai ${role}.`,
    data: { name, email, role },
  });

  revalidatePath("/employees");
  return { success: true as const };
}

export async function updateEmployee(id: string, formData: EmployeeFormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "employees", "edit"))
    return { success: false as const, error: { message: "Forbidden" } };

  const parsed = employeeFormSchema.safeParse(formData);
  if (!parsed.success)
    return { success: false as const, error: { message: parsed.error.issues[0].message } };

  const { name, email, password, role, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return { success: false as const, error: { message: "Karyawan tidak ditemukan" } };

  const emailDup = await prisma.user.findFirst({
    where: { email, id: { not: id } },
  });
  if (emailDup) return { success: false as const, error: { message: "Email sudah digunakan" } };

  const clientIp = await getClientIp();

  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = { name, email, role, phone: phone || null };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await tx.user.update({
      where: { id },
      data: updateData,
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_UPDATED",
        module: "employees",
        description: `Update karyawan: ${name}`,
        oldData: { name: existing.name, email: existing.email, role: existing.role },
        newData: { name, email, role },
        ipAddress: clientIp,
      },
    });
  });

  revalidatePath("/employees");
  return { success: true as const };
}

export async function toggleEmployeeActive(id: string, active: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "employees", "edit"))
    return { success: false as const, error: { message: "Forbidden" } };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false as const, error: { message: "Karyawan tidak ditemukan" } };

  const clientIp = await getClientIp();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { status: active ? "ACTIVE" : "INACTIVE" },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_TOGGLED",
        module: "employees",
        description: `${active ? "Aktifkan" : "Nonaktifkan"} karyawan: ${user.name}`,
        ipAddress: clientIp,
      },
    });
  });

  await notifyRole(["OWNER"], {
    type: "EMPLOYEE_STATUS_CHANGED",
    title: active ? "Karyawan Diaktifkan" : "Karyawan Dinonaktifkan",
    message: `${user.name} telah ${active ? "diaktifkan" : "dinonaktifkan"}.`,
    data: { userId: id, name: user.name, status: active ? "ACTIVE" : "INACTIVE" },
  });

  revalidatePath("/employees");
  return { success: true as const };
}

export async function resetEmployeePassword(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "employees", "edit"))
    return { success: false as const, error: { message: "Forbidden" } };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false as const, error: { message: "Karyawan tidak ditemukan" } };

  const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || "password123";
  const hashed = await bcrypt.hash(defaultPassword, 10);
  const clientIp = await getClientIp();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { password: hashed },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_PASSWORD_RESET",
        module: "employees",
        description: `Reset password karyawan: ${user.name}`,
        newData: { id, name: user.name },
        ipAddress: clientIp,
      },
    });
  });

  await notifyRole(["OWNER"], {
    type: "EMPLOYEE_PASSWORD_RESET",
    title: "Password Karyawan Direset",
    message: `Password ${user.name} telah direset.`,
    data: { userId: id, name: user.name },
  });

  revalidatePath("/employees");
  return { success: true as const, message: `Password direset ke: ${defaultPassword}` };
}

type EmployeeFormData = {
  name: string;
  email: string;
  password?: string;
  role: "SUPER_ADMIN" | "OWNER" | "CASHIER" | "WAREHOUSE" | "FINANCE";
  phone?: string;
};
