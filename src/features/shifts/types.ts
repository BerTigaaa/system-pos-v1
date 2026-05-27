import { z } from "zod";

export const openShiftSchema = z.object({
  openingBalance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif"),
  notes: z.string().optional(),
});

export const closeShiftSchema = z.object({
  closingBalance: z.coerce.number().min(0, "Saldo akhir tidak boleh negatif"),
  notes: z.string().optional(),
});

export type OpenShiftFormData = z.infer<typeof openShiftSchema>;
export type CloseShiftFormData = z.infer<typeof closeShiftSchema>;

export type ShiftItem = {
  id: string;
  userId: string;
  userName: string;
  status: "OPEN" | "CLOSED";
  openingBalance: number;
  closingBalance: number | null;
  totalCash: number;
  totalQris: number;
  totalTransfer: number;
  totalCard: number;
  totalSales: number;
  totalTransactions: number;
  openedAt: Date;
  closedAt: Date | null;
  notes: string | null;
};
