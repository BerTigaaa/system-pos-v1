import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password", 12);

  // Create one account per role
  const roles = [
    { name: "Super Admin", email: "super_admin@bertigapos.local", role: "SUPER_ADMIN" as const },
    { name: "Owner", email: "owner@bertigapos.local", role: "OWNER" as const },
    { name: "Cashier", email: "cashier@bertigapos.local", role: "CASHIER" as const },
    { name: "Warehouse", email: "warehouse@bertigapos.local", role: "WAREHOUSE" as const },
    { name: "Finance", email: "finance@bertigapos.local", role: "FINANCE" as const },
  ];

  for (const user of roles) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password,
        role: user.role,
        status: "ACTIVE",
        isActive: true,
      },
    });
    console.log(`${user.role} created: ${user.email} / password`);
  }

  // Create Business Info
  await prisma.businessInfo.create({
    data: {
      name: "Toko Demo BertigaPos",
      ownerName: "Budi Santoso",
      phone: "081234567890",
      email: "owner@demo.com",
    },
  });

  // Default Cash Flow Categories
  const cashInCategories = ["Penjualan", "Modal", "Pinjaman", "Lain-lain"];
  const cashOutCategories = [
    "Pembelian Stok",
    "Gaji Karyawan",
    "Sewa Tempat",
    "Listrik & Air",
    "Operasional",
    "Lain-lain",
  ];

  for (const name of cashInCategories) {
    await prisma.cashFlowCategory.upsert({
      where: { name_type: { name, type: "IN" } },
      update: {},
      create: { name, type: "IN", isDefault: true },
    });
  }
  for (const name of cashOutCategories) {
    await prisma.cashFlowCategory.upsert({
      where: { name_type: { name, type: "OUT" } },
      update: {},
      create: { name, type: "OUT", isDefault: true },
    });
  }
  console.log("Cash flow categories created");

  // Default Settings
  const defaultSettings = [
    { key: "tax_enabled", value: "false" },
    { key: "tax_percent", value: "11" },
    { key: "invoice_prefix", value: "INV" },
    { key: "receipt_paper_size", value: "80" },
    { key: "receipt_show_logo", value: "true" },
    { key: "receipt_footer", value: "Terima kasih atas kunjungan Anda!" },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("Default settings created");

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
