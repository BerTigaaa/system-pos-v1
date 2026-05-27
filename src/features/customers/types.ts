import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(10, "Minimal 10 digit"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export type CustomerItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  totalSpent: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: Date;
};
