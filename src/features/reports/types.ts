import { z } from "zod";

export const reportPeriodSchema = z.object({
  date: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2099).default(new Date().getFullYear()),
  categoryId: z.string().optional(),
  cashierId: z.string().optional(),
});

export type ReportPeriod = z.infer<typeof reportPeriodSchema>;

export type DailySalesRow = {
  hour: string;
  transactionCount: number;
  totalRevenue: number;
  totalItems: number;
};

export type MonthlySalesRow = {
  day: number;
  date: string;
  transactionCount: number;
  totalRevenue: number;
};

export type YearlySalesRow = {
  month: number;
  monthName: string;
  transactionCount: number;
  totalRevenue: number;
};

export type TopProductRow = {
  productId: string;
  productName: string;
  categoryName: string | null;
  totalQuantity: number;
  totalRevenue: number;
  totalBuyPrice: number;
  grossProfit: number;
};

export type StockReportRow = {
  id: string;
  name: string;
  sku: string;
  categoryName: string | null;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  status: "in_stock" | "low" | "out";
};

export type CashierReportRow = {
  cashierId: string;
  cashierName: string;
  totalShifts: number;
  totalTransactions: number;
  totalRevenue: number;
};
