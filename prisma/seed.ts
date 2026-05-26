import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Developer
  const devPassword = await bcrypt.hash("Admin@123", 12);
  const developer = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@bertigapos.com",
      password: devPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isActive: true,
    },
  });
  console.log("Developer created:", developer.email);

  // Create Business Info
  await prisma.businessInfo.create({
    data: {
      name: "Toko Demo BertigaPos",
      ownerName: "Budi Santoso",
      phone: "081234567890",
      email: "owner@demo.com",
    },
  });

  // Create Owner Demo
  const ownerPassword = await bcrypt.hash("Owner@123", 12);
  const owner = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "owner@demo.com",
      password: ownerPassword,
      role: "OWNER",
      status: "ACTIVE",
      isActive: true,
    },
  });
  console.log("Owner created:", owner.email);

  // Create 5 Cashiers
  const cashierPassword = await bcrypt.hash("Kasir@123", 12);
  const cashierNames = ["Siti", "Rina", "Ahmad", "Dewi", "Bagus"];
  for (const name of cashierNames) {
    await prisma.user.create({
      data: {
        name,
        email: `kasir${name.toLowerCase()}@demo.com`,
        password: cashierPassword,
        role: "CASHIER",
        status: "ACTIVE",
        isActive: true,
      },
    });
  }
  console.log("Cashiers created:", cashierNames.length);

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
    await prisma.cashFlowCategory.create({
      data: { name, type: "IN", isDefault: true },
    });
  }
  for (const name of cashOutCategories) {
    await prisma.cashFlowCategory.create({
      data: { name, type: "OUT", isDefault: true },
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
    {
      key: "receipt_footer",
      value: "Terima kasih atas kunjungan Anda!",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.create({ data: setting });
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
