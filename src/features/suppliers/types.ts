import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

export type SupplierItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
};
