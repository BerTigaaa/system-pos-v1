import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dummy data cafe...\n");

  // ===== CATEGORIES =====
  const catData = [
    { name: "Kopi", description: "Minuman kopi spesial" },
    { name: "Non-Kopi", description: "Minuman tanpa kopi" },
    { name: "Minuman Segar", description: "Minuman dingin segar" },
    { name: "Makanan Ringan", description: "Camilan & makanan kecil" },
  ];

  const categories: Record<string, string> = {};
  for (const c of catData) {
    const created = await prisma.category.upsert({
      where: { id: c.name },
      update: {},
      create: { id: c.name, name: c.name, description: c.description },
    });
    categories[c.name] = created.id;
  }
  console.log(`✅ ${catData.length} categories`);

  // ===== PRODUCTS =====
  const productData = [
    { name: "Americano", sku: "KOP-001", barcode: "8991001", category: "Kopi", sellPrice: 25000, buyPrice: 12000, stock: 100, unit: "cup", imageUrl: "https://picsum.photos/seed/americano/300/300" },
    { name: "Cappuccino", sku: "KOP-002", barcode: "8991002", category: "Kopi", sellPrice: 35000, buyPrice: 15000, stock: 80, unit: "cup", imageUrl: "https://picsum.photos/seed/cappuccino/300/300" },
    { name: "Cafe Latte", sku: "KOP-003", barcode: "8991003", category: "Kopi", sellPrice: 35000, buyPrice: 15000, stock: 75, unit: "cup", imageUrl: "https://picsum.photos/seed/cafe-latte/300/300" },
    { name: "Espresso", sku: "KOP-004", barcode: "8991004", category: "Kopi", sellPrice: 20000, buyPrice: 10000, stock: 120, unit: "cup", imageUrl: "https://picsum.photos/seed/espresso/300/300" },
    { name: "Mocha", sku: "KOP-005", barcode: "8991005", category: "Kopi", sellPrice: 40000, buyPrice: 18000, stock: 60, unit: "cup", imageUrl: "https://picsum.photos/seed/mocha/300/300" },
    { name: "Cold Brew", sku: "KOP-006", barcode: "8991006", category: "Kopi", sellPrice: 30000, buyPrice: 14000, stock: 45, unit: "cup", imageUrl: "https://picsum.photos/seed/cold-brew/300/300" },
    { name: "Vietnam Drip", sku: "KOP-007", barcode: "8991007", category: "Kopi", sellPrice: 28000, buyPrice: 13000, stock: 50, unit: "cup", imageUrl: "https://picsum.photos/seed/vietnam-drip/300/300" },
    { name: "Matcha Latte", sku: "NON-001", barcode: "8992001", category: "Non-Kopi", sellPrice: 35000, buyPrice: 16000, stock: 70, unit: "cup", imageUrl: "https://picsum.photos/seed/matcha-latte/300/300" },
    { name: "Chocolate", sku: "NON-002", barcode: "8992002", category: "Non-Kopi", sellPrice: 30000, buyPrice: 14000, stock: 65, unit: "cup", imageUrl: "https://picsum.photos/seed/chocolate/300/300" },
    { name: "Vanilla Latte", sku: "NON-003", barcode: "8992003", category: "Non-Kopi", sellPrice: 35000, buyPrice: 15000, stock: 55, unit: "cup", imageUrl: "https://picsum.photos/seed/vanilla-latte/300/300" },
    { name: "Red Velvet", sku: "NON-004", barcode: "8992004", category: "Non-Kopi", sellPrice: 35000, buyPrice: 17000, stock: 40, unit: "cup", imageUrl: "https://picsum.photos/seed/red-velvet/300/300" },
    { name: "Taro Latte", sku: "NON-005", barcode: "8992005", category: "Non-Kopi", sellPrice: 32000, buyPrice: 15000, stock: 3, unit: "cup", imageUrl: "https://picsum.photos/seed/taro-latte/300/300" },
    { name: "Fresh Orange Juice", sku: "SEG-001", barcode: "8993001", category: "Minuman Segar", sellPrice: 28000, buyPrice: 12000, stock: 30, unit: "cup", imageUrl: "https://picsum.photos/seed/orange-juice/300/300" },
    { name: "Lemon Tea", sku: "SEG-002", barcode: "8993002", category: "Minuman Segar", sellPrice: 22000, buyPrice: 8000, stock: 1, unit: "cup", imageUrl: "https://picsum.photos/seed/lemon-tea/300/300" },
    { name: "Strawberry Smoothie", sku: "SEG-003", barcode: "8993003", category: "Minuman Segar", sellPrice: 35000, buyPrice: 18000, stock: 20, unit: "cup", imageUrl: "https://picsum.photos/seed/strawberry-smoothie/300/300" },
    { name: "Mango Smoothie", sku: "SEG-004", barcode: "8993004", category: "Minuman Segar", sellPrice: 32000, buyPrice: 16000, stock: 2, unit: "cup", imageUrl: "https://picsum.photos/seed/mango-smoothie/300/300" },
    { name: "French Fries", sku: "MAK-001", barcode: "8994001", category: "Makanan Ringan", sellPrice: 25000, buyPrice: 10000, stock: 50, unit: "porsi", imageUrl: "https://picsum.photos/seed/french-fries/300/300" },
    { name: "Chicken Wings", sku: "MAK-002", barcode: "8994002", category: "Makanan Ringan", sellPrice: 35000, buyPrice: 20000, stock: 35, unit: "porsi", imageUrl: "https://picsum.photos/seed/chicken-wings/300/300" },
    { name: "Nachos", sku: "MAK-003", barcode: "8994003", category: "Makanan Ringan", sellPrice: 30000, buyPrice: 15000, stock: 25, unit: "porsi", imageUrl: "https://picsum.photos/seed/nachos/300/300" },
    { name: "Sandwich", sku: "MAK-004", barcode: "8994004", category: "Makanan Ringan", sellPrice: 32000, buyPrice: 18000, stock: 0, unit: "porsi", imageUrl: "https://picsum.photos/seed/sandwich/300/300" },
    { name: "Croissant", sku: "MAK-005", barcode: "8994005", category: "Makanan Ringan", sellPrice: 28000, buyPrice: 14000, stock: 10, unit: "pcs", imageUrl: "https://picsum.photos/seed/croissant/300/300" },
  ];

  const products: { id: string; name: string; sellPrice: number }[] = [];
  for (const p of productData) {
    const created = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { imageUrl: p.imageUrl },
      create: {
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        categoryId: categories[p.category],
        sellPrice: p.sellPrice,
        buyPrice: p.buyPrice,
        stock: p.stock,
        unit: p.unit,
        imageUrl: p.imageUrl,
        isActive: true,
        minStock: 5,
      },
    });
    products.push({ id: created.id, name: created.name, sellPrice: Number(created.sellPrice) });
  }
  console.log(`✅ ${productData.length} products`);

  // ===== TRANSACTIONS for yesterday's shift =====
  const customerNames = [
    "Rina Wijaya", "Andi Pratama", "Sari Dewi", "Budi Hartono",
    "Maya Anggraini", "Dimas Putra", "Lisa Kusuma", "Rudi Hermawan",
  ];

  const trxData = [
    { inv: "INV-20260526-001", time: 9, customer: 0, items: [0, 2], qty: [1, 1], method: "CASH" },
    { inv: "INV-20260526-002", time: 10, customer: 1, items: [1, 15], qty: [2, 1], method: "QRIS" },
    { inv: "INV-20260526-003", time: 11, customer: 2, items: [3, 0], qty: [1, 1], method: "CASH" },
    { inv: "INV-20260526-004", time: 12, customer: null, items: [4, 16, 7], qty: [1, 1, 1], method: "CASH" },
    { inv: "INV-20260526-005", time: 13, customer: 3, items: [5, 11], qty: [2, 1], method: "QRIS" },
    { inv: "INV-20260526-006", time: 14, customer: 4, items: [6, 8, 20], qty: [1, 2, 1], method: "CASH" },
    { inv: "INV-20260526-007", time: 15, customer: null, items: [12, 17], qty: [1, 1], method: "CASH" },
    { inv: "INV-20260526-008", time: 16, customer: 5, items: [9, 13, 18], qty: [1, 2, 1], method: "QRIS" },
  ];
  const supplierData = [
    { name: "PT Kopi Nusantara", phone: "021-5550011", email: "sales@kopinusantara.com", address: "Jakarta Pusat" },
    { name: "CV Segar Abadi", phone: "021-5550022", email: "order@segarabadi.com", address: "Jakarta Selatan" },
    { name: "Toko Snack Makmur", phone: "021-5550033", email: null, address: "Jakarta Timur" },
    { name: "PT Minuman Sejahtera", phone: "021-5550044", email: "info@minumansejahtera.co.id", address: "Jakarta Barat" },
  ];

  for (const s of supplierData) {
    await prisma.supplier.upsert({
      where: { id: s.name },
      update: {},
      create: { id: s.name, name: s.name, phone: s.phone, email: s.email, address: s.address, isActive: true },
    });
  }
  console.log(`✅ ${supplierData.length} suppliers`);

  // ===== SHIFTS & TRANSACTIONS =====
  const cashier = await prisma.user.findUnique({ where: { email: "cashier@bertigapos.local" } });
  const superAdmin = await prisma.user.findUnique({ where: { email: "super_admin@bertigapos.local" } });
  if (!cashier || !superAdmin) {
    console.log("❌ Seed users not found, run prisma seed first");
    return;
  }

  // Yesterday's closed shift (simulate a full day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(8, 0, 0, 0);

  const yesterdayClose = new Date();
  yesterdayClose.setDate(yesterdayClose.getDate() - 1);
  yesterdayClose.setHours(17, 30, 0, 0);

  const closedShift = await prisma.shift.upsert({
    where: { id: "shift-yesterday" },
    update: {},
    create: {
      id: "shift-yesterday",
      userId: cashier.id,
      status: "CLOSED",
      openingBalance: 500000,
      closingBalance: 1850000,
      totalCash: 1350000,
      totalQris: 500000,
      totalTransfer: 0,
      totalCard: 0,
      totalSales: 1850000,
      totalTransactions: 8,
      openedAt: yesterday,
      closedAt: yesterdayClose,
    },
  });
  console.log(`✅ Yesterday's shift created`);

  // Today's active shift
  const today = new Date();
  today.setHours(7, 45, 0, 0);

  await prisma.shift.upsert({
    where: { id: "shift-today" },
    update: {},
    create: {
      id: "shift-today",
      userId: cashier.id,
      status: "OPEN",
      openingBalance: 300000,
      openedAt: today,
    },
  });
  console.log(`✅ Today's active shift created`);

  let totalTrx = 0;
  for (const t of trxData) {
    const trxTime = new Date(yesterday);
    trxTime.setHours(t.time, Math.floor(Math.random() * 60), 0, 0);

    let subtotal = 0;
    const trxItems: {
      productId: string;
      productName: string;
      productSku: string;
      buyPrice: number;
      sellPrice: number;
      quantity: number;
      discountAmount: number;
      subtotal: number;
    }[] = [];

    for (let i = 0; i < t.items.length; i++) {
      const p = products[t.items[i]];
      const qty = t.qty[i] ?? 1;
      const itemSub = p.sellPrice * qty;
      subtotal += itemSub;
      trxItems.push({
        productId: p.id,
        productName: p.name,
        productSku: "",
        buyPrice: 0,
        sellPrice: p.sellPrice,
        quantity: qty,
        discountAmount: 0,
        subtotal: itemSub,
      });
    }

    const total = subtotal;
    const paymentAmount = total;

    await prisma.transaction.create({
      data: {
        invoiceNumber: t.inv,
        shiftId: closedShift.id,
        cashierId: cashier.id,
        customerName: t.customer !== null ? customerNames[t.customer] : null,
        status: "COMPLETED",
        subtotal,
        discountAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        total,
        createdAt: trxTime,
        items: { create: trxItems },
        payments: {
          create: {
            method: t.method as "CASH" | "QRIS",
            amount: paymentAmount,
            changeAmount: t.method === "CASH" ? Math.floor(Math.random() * 5000) + 1000 : 0,
          },
        },
      },
    });

    totalTrx++;
  }
  console.log(`✅ ${totalTrx} transactions completed`);

  console.log("\n🎉 Cafe dummy data seeding complete!");
  console.log("   Try login and explore the POS at /pos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
