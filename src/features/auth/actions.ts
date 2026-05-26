"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, changePasswordSchema } from "@/lib/validations/auth";
import { auth } from "@/lib/auth";

export async function registerTrial(formData: FormData) {
  const raw = {
    businessName: formData.get("businessName") as string,
    ownerName: formData.get("ownerName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Input tidak valid",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const { businessName, ownerName, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: {
        code: "DUPLICATE_ENTRY",
        message: "Email sudah terdaftar",
      },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const trialDuration = parseInt(
    process.env.TRIAL_DURATION_DAYS || "14",
    10
  );
  const now = new Date();
  const trialEnd = new Date(now.getTime() + trialDuration * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name: ownerName,
        email,
        phone,
        password: hashedPassword,
        role: "OWNER",
        status: "TRIAL",
        trialStartDate: now,
        trialEndDate: trialEnd,
        isActive: true,
      },
    });

    await tx.businessInfo.create({
      data: {
        name: businessName,
        ownerName,
        phone,
        email,
      },
    });
  });

  return {
    success: true,
    message: "Registrasi berhasil! Silakan login.",
  };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" },
    };
  }

  const raw = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmNewPassword: formData.get("confirmNewPassword") as string,
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Input tidak valid",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "User tidak ditemukan" },
    };
  }

  const isValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.password
  );
  if (!isValid) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Password saat ini salah" },
    };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { success: true, message: "Password berhasil diubah" };
}

export async function updateAccountStatus(
  userId: string,
  newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "Tidak punya akses" },
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
  });

  return { success: true, message: "Status akun berhasil diubah" };
}
