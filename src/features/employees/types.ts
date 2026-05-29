import { z } from "zod";
import { UserRole, AccountStatus } from "@prisma/client";

export const employeeFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export type EmployeeItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  phone: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};
