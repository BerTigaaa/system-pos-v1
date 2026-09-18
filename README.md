<div align="center">
  <h1>BertigaPos</h1>
  <p>Sistem POS (Point of Sale) modern untuk retail & UMKM — berbasis web, multi-role, real-time.</p>
</div>

---

## Daftar Isi

- [Cara Clone & Setup](#cara-clone--setup)
- [Daftar Perintah](#daftar-perintah)
- [Tech Stack](#tech-stack)
- [Role & Hak Akses](#role--hak-akses)
- [Halaman & Fitur](#halaman--fitur)
  - [Dashboard](#1-dashboard)
  - [POS (Point of Sale)](#2-pos)
  - [Shift](#3-shift)
  - [Produk](#4-produk)
  - [Gudang & Bahan Baku](#5-gudang--bahan-baku)
  - [Supplier](#6-supplier)
  - [Transaksi](#7-transaksi)
  - [Keuangan](#8-keuangan)
  - [Laporan](#9-laporan)
  - [Karyawan](#10-karyawan)
  - [Admin](#11-admin)
  - [Audit Log](#12-audit-log)
  - [Notifikasi](#13-notifikasi)
  - [Pengaturan](#14-pengaturan)
- [Arsitektur Stok](#arsitektur-stok)
- [Upload Foto Produk](#upload-foto-produk)
- [Notifikasi](#notifikasi)
- [Permission Matrix](#permission-matrix)
- [Struktur Database](#struktur-database)
- [Struktur Proyek](#struktur-proyek)
- [Catatan & Batasan](#catatan--batasan)

---

## Cara Clone & Setup

```bash
# 1. Clone repository
git clone https://github.com/BerTigaaa/system-pos-v1.git
cd system-pos-v1

# 2. Copy & isi environment variables
cp .env.example .env
# Edit .env — isi DATABASE_URL, NEXTAUTH_SECRET, dll sesuai kebutuhan

# 3. Install dependencies
npm install

# 4. Setup database (PostgreSQL harus sudah jalan)
npx prisma db push
npx prisma db seed

# 5. Jalankan dev server
npm run dev
```

Buka **http://localhost:3000** — login menggunakan akun seed:

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | `super_admin@bertigapos.local` | `password` |
| OWNER | `owner@bertigapos.local` | `password` |
| CASHIER | `cashier@bertigapos.local` | `password` |
| WAREHOUSE | `warehouse@bertigapos.local` | `password` |
| FINANCE | `finance@bertigapos.local` | `password` |

> **Catatan:** Pastikan PostgreSQL active & database `bertigapos` sudah dibuat.

---

## Daftar Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Menjalankan dev server → http://localhost:3000 |
| `npm run dev:network` | Dev server dengan akses jaringan (`-H 0.0.0.0`) |
| `npm run build` | Build produksi |
| `npm start` | Menjalankan hasil build |
| `npm run lint` | Lint (Next.js lint) |
| `npm run typecheck` | Type-check TypeScript (`tsc --noEmit`) |
| `npm test` / `npm run test:watch` | Menjalankan test (vitest) |
| `npm run seed:cafe` | Seed data demo cafe (`prisma/seed-cafe.ts`) |
| `npx prisma migrate dev` | Menjalankan migrasi + regenerate Prisma client |
| `npx prisma db seed` | Menjalankan seed utama |

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), TypeScript 6, TailwindCSS 4, Ant Design 6, Zustand 5, Recharts 3
- **Backend:** Next.js Server Actions, Prisma ORM 6, PostgreSQL 16
- **Auth:** NextAuth v5 (Auth.js), bcryptjs, RBAC (hardcoded + DB override)
- **Upload:** Local file storage (`public/products/`)
- **Deploy:** Vercel / Railway / VPS

---

## Role & Hak Akses

Ada **5 role** dengan akses berbeda:

| Role | Deskripsi |
|------|-----------|
| **SUPER_ADMIN** | Developer/system admin — full akses ke semua fitur |
| **OWNER** | Pemilik bisnis — full akses data bisnis, kecuali admin sistem |
| **CASHIER** | Kasir — POS, transaksi, shift, dashboard |
| **WAREHOUSE** | Gudang — bahan baku, produk (view), supplier |
| **FINANCE** | Keuangan — laporan, kas masuk/keluar, rekap |

---

## Halaman & Fitur

### 1. Dashboard

**Akses:** Semua role

**Tampilan:**
- Greeting + user info
- 4 kartu statistik: Penjualan Hari Ini, Jumlah Transaksi, Rata-rata Transaksi, Total Produk
- Grafik penjualan 7 hari (area chart)
- Daftar bahan baku stok menipis (stok ≤ min_stock)
- 10 transaksi terbaru

**Aksi:**
- Klik "Lihat Semua" → halaman Transaksi

---

### 2. POS

**Akses:** SUPER_ADMIN, OWNER, **CASHIER**

#### Mode: Pesan
**Tampilan:**
- Grid produk (search by nama/SKU/barcode, filter kategori)
- Nama pelanggan, pilih meja, daftar item di cart

**Aksi:**
- Klik produk → tambah ke cart (tanpa validasi stok — produk display-only)
- +/- quantity, hapus item
- Pilih meja (kursi tersedia saja)
- **"Pesan"** → buat order status PENDING

#### Mode: Bayar
**Tampilan:**
- Pilih meja → lihat semua order COMPLETED (belum dibayar)
- Total semua order meja tersebut

**Aksi:**
- **"Bayar Rp X"** → pilih metode pembayaran (CASH / QRIS / BANK_TRANSFER / DEBIT_CARD)
- Cash: input jumlah dibayar, hitung kembalian otomatis
- Diskon % per transaksi
- Cetak struk (browser print)

#### Mode: Pesanan
**Tampilan:**
- Daftar order semua shift open: nomor meja, pelanggan, status, item, total

**Aksi:**
- **PENDING** → **Konfirmasi** (mulai proses), **Batal**
- **CONFIRMED** → **Antar** (makanan siap)
- **COMPLETED** → badge "Selesai" (read-only)
- **CANCELLED** → badge "Dibatalkan" (read-only)

#### Mode: Selesai
**Tampilan:**
- Daftar order yang sudah dibayar (Lunas)

---

### 3. Shift

**Akses:** SUPER_ADMIN, OWNER, **CASHIER**

**Tampilan:**
- Kartu shift aktif (nama kasir, jam buka, total penjualan)
- Riwayat shift: kasir, status, saldo awal/akhir, total penjualan, jumlah transaksi

**Aksi:**
- **"Buka Shift"** — modal input saldo awal + catatan
- **"Tutup Shift"** — modal input saldo akhir + catatan (rekap otomatis dari transaksi POS)

> Shift harus dibuka sebelum bertransaksi di POS. Data keuangan (kas masuk/keluar) TIDAK terikat shift.

---

### 4. Produk

**Akses:** SUPER_ADMIN, OWNER, **WAREHOUSE**

**Tampilan:**
- Tabel produk: gambar, nama+SKU, kategori, harga jual, status (aktif/nonaktif)
- **Catatan:** Produk bersifat **display-only** — tidak ada kolom stok

**Aksi:**
- **"Tambah Produk"** — form: nama, SKU (auto/manual), barcode, kategori, satuan (pcs/kg/liter/box), harga beli, harga jual, deskripsi, gambar (upload atau URL)
- **Edit** — form sama terisi
- **Hapus** — soft delete (konfirmasi)
- **Toggle aktif/nonaktif** — inline switch
- **"Kelola Kategori"** — tambah/edit/hapus kategori

> Stok produk tidak dikelola di sini. Manajemen stok dilakukan di modul **Bahan Baku**.

---

### 5. Gudang & Bahan Baku

**Akses:** SUPER_ADMIN, OWNER, **WAREHOUSE**

Halaman Gudang memiliki **6 tab** (tabel otomatis refresh saat ada pergerakan stok via event bus):

#### Tab 1: Bahan Baku
**Tampilan:** Tabel bahan baku: nama, SKU, kategori, satuan, stok saat ini, stok minimum, harga beli, status

**Aksi:**
- **"Tambah Bahan Baku"** — form: nama, SKU, kategori, satuan, harga beli, stok minimum, deskripsi
- **Edit** — inline edit
- **Hapus** — soft delete

#### Tab 2: Stok Masuk
**Tampilan:** Form stok masuk + riwayat stok masuk

**Aksi:**
- Pilih bahan baku
- Pilih supplier
- Input: kode batch, jumlah, **harga beli per satuan**, tanggal terima, tanggal kadaluwarsa (opsional)
- Batch otomatis menambah stok bahan baku

#### Tab 3: Stok Keluar
**Tampilan:** Form stok keluar + riwayat stok keluar

**Aksi:**
- Pilih bahan baku
- Input: jumlah, alasan (produksi, rusak, sample, dll)
- Sistem otomatis pilih batch tertua (**FIFO** — First In First Out)

#### Tab 4: Riwayat Bahan Baku
**Tampilan:** Riwayat semua pergerakan stok bahan baku

**Filter:** Search nama, filter tipe (STOCK_IN / STOCK_OUT)

> Tipe `ADJUSTMENT` / `OPNAME` ada di enum & label UI namun belum ada aksi yang membuatnya — lihat [Catatan & Batasan](#catatan--batasan).

#### Tab 5: Kadaluwarsa
**Tampilan:** Daftar batch yang akan expired dalam 14 hari ke depan

**Highlight:** Batch yang sudah expired ditampilkan di atas

#### Tab 6: Supplier
**Tampilan:** Tabel supplier: nama, telepon, email, alamat

**Aksi:** Tambah, Edit, Hapus

---

### 6. Supplier

**Akses:** SUPER_ADMIN, OWNER, **WAREHOUSE** (view/create/edit)

**Tampilan:** Tabel supplier: nama, telepon, email, alamat

**Aksi:** Tambah, Edit, Hapus

---

### 7. Transaksi

**Akses:** SUPER_ADMIN, OWNER, FINANCE (view), **CASHIER** (view/create)

**Tampilan:**
- Tabel transaksi: invoice, tanggal, kasir, pelanggan, total, metode bayar, status

**Filter:** Search invoice, filter status, metode bayar, range tanggal

**Aksi:**
- Lihat detail (drawer): items, ringkasan keuangan, histori refund
- **"Refund"** (khusus SUPER_ADMIN / OWNER) — pilih item, qty, alasan → refund tercatat (stok produk tidak dikembalikan — display-only)
- **"Cetak Struk"**
- Export Excel & PDF

---

### 8. Keuangan

**Akses:** SUPER_ADMIN, OWNER, **FINANCE**

#### Tab: Kas Masuk
**Tampilan:** Tabel pemasukan: tanggal, kategori, deskripsi, jumlah (hijau)
**Aksi:** Tambah, Edit, Hapus — filter kategori & tanggal

**Kategori Kas Masuk:** Penjualan, Modal, Pinjaman, Lain-lain

#### Tab: Kas Keluar
**Tampilan:** Tabel pengeluaran: jumlah (merah)
**Aksi:** Tambah, Edit, Hapus — filter kategori & tanggal

**Kategori Kas Keluar:** Pembelian Stok, Gaji, Sewa, Utilitas, Operasional, Lain-lain

#### Tab: Rekap (P&L)
**Tampilan:** Kartu statistik: Penjualan, Kas Masuk, Total Pendapatan, HPP, Laba Kotor, Kas Keluar, Laba Bersih
**Filter:** Bulan & Tahun

> **Catatan:** Keuangan (Kas Masuk/Kas Keluar) adalah catatan manual untuk aktivitas non-penjualan (sewa, gaji, modal, dll). TIDAK terikat dengan shift.
>
> **HPP & Laba Kotor** pada tab Rekap dihitung dari total `buyPrice × qty` transaksi COMPLETED pada periode tersebut (COGS dicatat saat checkout dari harga beli produk).

---

### 9. Laporan

**Akses:** SUPER_ADMIN, OWNER, **FINANCE**

| Tab | Isi |
|-----|-----|
| Penjualan Harian | Breakdown per jam + total — filter tanggal |
| Penjualan Bulanan | Rekap bulanan — filter bulan & tahun |
| Penjualan Tahunan | Rekap tahunan — filter tahun |
| Produk Terlaris | Top produk (qty, revenue, laba kotor) — filter periode & kategori |
| Aktivitas Kasir | Aktivitas per kasir — filter kasir, periode |

**Aksi:** Export Excel (.xlsx) & PDF (.pdf) di setiap tab.

> **Catatan:** Kolom **Laba Kotor** di Produk Terlaris dihitung `Revenue − HPP`, dengan HPP memakai harga beli produk (`buyPrice`) yang dicatat saat checkout. Laporan **Stok Bahan Baku** sudah tersedia di backend (`getStockReport`) namun belum ditampilkan sebagai tab — lihat [Catatan & Batasan](#catatan--batasan).

---

### 10. Karyawan

**Akses:** SUPER_ADMIN, OWNER

**Tampilan:** Tabel karyawan: nama, email, role (tag), status aktif/nonaktif, terakhir login

**Filter:** Search, filter role, filter status

**Aksi:**
- **"Tambah Karyawan"** — nama, email, password, role (Owner/Kasir/Gudang/Keuangan), telepon
- Edit, aktif/nonaktifkan
- **Reset password** — reset ke password default (dari env `DEFAULT_EMPLOYEE_PASSWORD`)

---

### 11. Admin

**Akses:** SUPER_ADMIN, OWNER

**Tampilan:**
- 6 kartu statistik: Revenue Hari Ini, Transaksi Hari Ini, Total Produk, Total User, Total Transaksi, Total Refund
- Tabel semua user: nama, email, role (editable dropdown), status, aktif switch, tanggal daftar

**Aksi:**
- Ubah role user (dropdown inline: SUPER_ADMIN, OWNER, CASHIER, WAREHOUSE, FINANCE)
- Aktif/nonaktifkan user (switch)

---

### 12. Audit Log

**Akses:** SUPER_ADMIN, OWNER

**Tampilan:** Tabel log: waktu, user+email, aksi (tag warna), modul (tag biru), deskripsi (bahasa Indonesia), IP address

**Filter:** Search, filter modul, range tanggal

---

### 13. Notifikasi

**Akses:** Semua role (melihat notifikasi milik sendiri sesuai userId)

**Tampilan:**
- Daftar notifikasi: indikator unread (titik biru), tipe (tag), judul, pesan, waktu

**Aksi:**
- **"Tandai semua dibaca"**
- Klik centang → tandai satu notifikasi dibaca

**Notifikasi yang terkirim secara otomatis:**
- Stok bahan baku menipis / habis → Owner, Warehouse
- Pesanan baru / status berubah → Cashier, Owner
- Refund diproses → Owner, Finance
- Perubahan data penting → Owner
- Login baru → Owner

---

### 14. Pengaturan

**Akses:** SUPER_ADMIN, OWNER

| Tab | Isi |
|-----|-----|
| **Bisnis** | Nama bisnis, pemilik, alamat, telepon, email |
| **POS** | Pajak (PPN) on/off + persentase, prefix invoice |
| **Struk** | Header/footer struk, tampilkan logo, ukuran kertas (58mm/80mm) |
| **Meja** | Self-order on/off, jumlah meja, cetak QR code meja |
| **Karyawan** | Link ke halaman Karyawan |

---

## Arsitektur Stok

### Produk = Display-Only

Produk di BertigaPos bersifat **display-only** — digunakan untuk:
- Menampilkan menu di POS
- Menampilkan gambar, nama, harga
- **Tidak** untuk manajemen stok

```
┌─────────────────────────────────────────────────────────┐
│  PRODUK (display-only)                                  │
│  • Nama, SKU, Harga, Gambar, Kategori                   │
│  • Tidak ada kolom stok                                 │
│  • Tidak ada validasi stok saat checkout                │
│  • Tidak ada decrement stok saat transaksi              │
└─────────────────────────────────────────────────────────┘
```

### Bahan Baku = Manajemen Stok

Stok dikelola melalui **Bahan Baku (Raw Materials)** dengan sistem batch:

```
┌─────────────────────────────────────────────────────────┐
│  BAHAN BAKU (stok sesungguhnya)                         │
│  • Nama, SKU, Kategori, Satuan, Harga Beli              │
│  • Stok saat ini (dihitung dari semua batch)            │
│  • Stok minimum (untuk peringatan)                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  BATCH (RawMaterialBatch)                               │
│  • Batch Code, Quantity, Harga Beli                     │
│  • Tanggal Terima, Tanggal Kadaluwarsa                  │
│  • Supplier                                             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  PERGERAKAN (RawMaterialMovement)                       │
│  • Tipe: STOCK_IN / STOCK_OUT / ADJUSTMENT / OPNAME     │
│  • Quantity, Stok Sebelum/Sesudah                       │
│  • Batch (untuk STOCK_IN/STOCK_OUT)                     │
│  • Alasan, Catatan                                      │
└─────────────────────────────────────────────────────────┘
```

### Alur Stok Keluar (FIFO)

Saat stok keluar, sistem menggunakan metode **FIFO** (First In First Out):

```
1. User input: Bahan Baku "Kopi", Quantity: 10
2. Sistem cari batch tertua:
   - Batch A (expired: 2026-07-01): qty 5  → ambil 5
   - Batch B (expired: 2026-08-15): qty 8  → ambil 5
   - Batch C (expired: 2026-09-30): qty 12 → sisa tidak diambil
3. Hasil:
   - Batch A: qty 0 (habis)
   - Batch B: qty 3
   - Batch C: qty 12
   - Movement: STOCK_OUT, qty 10, stock_before 25, stock_after 15
```

### Peringatan Kadaluwarsa

Sistem menampilkan peringatan untuk batch yang akan expired:
- **≤ 14 hari**: Ditampilkan di tab Kadaluwarsa
- **Sudah expired**: Highlight merah di atas daftar

---

## Upload Foto Produk

Produk mendukung **dua cara** untuk menambahkan gambar:

### 1. Upload File
- Klik tombol **Upload** di form produk
- Pilih file gambar (JPG, PNG, WebP, GIF, max 5MB)
- File disimpan di `public/products/` dengan nama UUID
- URL: `/products/{uuid}.{ext}`

### 2. URL Eksternal
- Paste link gambar di input **Gambar**
- Contoh: `https://example.com/product.jpg`

### Konfigurasi
- File upload disimpan di folder `public/products/`
- Folder ini di-`.gitignore` (foto tidak di-commit ke git)
- Untuk production, pertimbangkan migrasi ke Cloudflare R2 atau S3

---

## Notifikasi

Notifikasi dikirim otomatis dari **23 titik** di seluruh modul:

| Tipe Notifikasi | Dikirim ke | Saat |
|----------------|-----------|------|
| `LOW_STOCK` | Owner, Warehouse | Stok bahan baku ≤ min_stok |
| `OUT_OF_STOCK` | Owner, Warehouse | Stok bahan baku = 0 |
| `REFUND_SUCCESS` | Owner, Finance | Refund berhasil |
| `STOCK_ADJUSTED` | Owner | Stok bahan baku disesuaikan |
| `ORDER_CREATED` | Cashier, Owner | Pesanan baru masuk |
| `ORDER_STATUS_CHANGED` | Cashier, Owner | Status pesanan berubah |
| `CASH_FLOW_CREATED` | Owner, Finance | Kas masuk/keluar baru |
| `EMPLOYEE_CREATED` | Owner | Karyawan baru ditambahkan |
| `EMPLOYEE_PASSWORD_RESET` | Owner | Password karyawan direset |
| `USER_ROLE_CHANGED` | Owner | Role user diubah |
| `SUPPLIER_CREATED` | Owner, Warehouse | Supplier baru |
| `PRODUCT_ADDED` | Owner, Warehouse | Produk baru ditambahkan |
| `PRODUCT_DELETED` | Owner, Warehouse | Produk dihapus |
| `PRODUCT_STATUS_CHANGED` | Owner, Warehouse | Produk diaktifkan/dinonaktifkan |
| dan tipe lainnya | — | — |

---

## Permission Matrix

| Modul | SUPER_ADMIN | OWNER | CASHIER | WAREHOUSE | FINANCE |
|-------|:-----------:|:-----:|:-------:|:---------:|:-------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| POS | ✅ | ✅ | ✅ | ❌ | ❌ |
| Shift | ✅ | ✅ | ✅ | ❌ | ❌ |
| Produk | ✅ | ✅ | ❌ | ✅ (view + manage) | ❌ |
| Gudang (Bahan Baku) | ✅ | ✅ | ❌ | ✅ (view + manage) | ❌ |
| Supplier | ✅ | ✅ | ❌ | ✅ (view + manage) | ❌ |
| Transaksi | ✅ | ✅ | ✅ (view + create) | ❌ | ✅ (view) |
| Refund | ✅ | ✅ | ❌ | ❌ | ❌ |
| Keuangan | ✅ | ✅ | ❌ | ❌ | ✅ (view + create) |
| Laporan | ✅ | ✅ | ❌ | ❌ | ✅ |
| Karyawan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ |
| Pengaturan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Notifikasi | ✅ (semua) | ✅ (semua) | ✅ (sendiri) | ✅ (sendiri) | ✅ (sendiri) |

---

## Struktur Database

```
┌─────────────────────────────────────────────────────────┐
│  ENTITAS UTAMA                                          │
├─────────────────────────────────────────────────────────┤
│  User, Role, RolePermission, PermissionOverride         │
│  Product, Category, Supplier                            │
│  RawMaterial, RawMaterialBatch, RawMaterialMovement     │
│  Transaction, TransactionItem, TransactionPayment       │
│  Order, OrderItem, Shift                                │
│  CashFlow, CashFlowCategory                             │
│  Setting, Notification, AuditLog, BusinessInfo          │
│  DiningTable, ExpenseCategory, Expense                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  RELASI PERSENTASE                                      │
├─────────────────────────────────────────────────────────┤
│  Product         → Category (1:N)                       │
│  Product         → TransactionItem, OrderItem           │
│  RawMaterial     → RawMaterialBatch (1:N)               │
│  RawMaterial     → RawMaterialMovement (1:N)            │
│  RawMaterialBatch → RawMaterialMovement (1:N)           │
│  Supplier        → RawMaterialBatch, RawMaterialMovement│
│  Transaction     → TransactionItem, TransactionPayment  │
│  Order           → OrderItem                            │
│  Shift           → Transaction                          │
│  User            → Shift, Transaction, CashFlow         │
└─────────────────────────────────────────────────────────┘
```

---

## Struktur Proyek

```
src/
├── app/                    # Halaman & routing (Next.js App Router)
│   ├── (auth)/             # Halaman login
│   ├── (landing)/          # Landing page publik
│   └── (dashboard)/        # Halaman utama (dashboard, pos, produk, gudang, ...)
├── components/
│   ├── ui/                 # Komponen UI reusable (PageHeader, dsb.)
│   └── public/             # Komponen landing page (animasi, dsb.)
├── features/               # Modul per domain — pattern utama kode ini
│   ├── <fitur>/actions.ts      # Server Actions (query + mutasi + RBAC)
│   ├── <fitur>/components/     # Komponen milik modul
│   └── <fitur>/types.ts        # Schema Zod + tipe TypeScript
├── hooks/                  # Custom React hooks
├── lib/                    # Helper & config (prisma.ts, auth.ts, dll.)
├── store/                  # Global state (Zustand)
├── proxy.ts                # Server proxy utility
└── types/                  # Tipe global

prisma/
├── schema.prisma          # Skema database
├── seed.ts                # Seed utama
├── seed-cafe.ts           # Seed data demo cafe (npm run seed:cafe)
└── migrations/            # Migrasi database
```

### Pola Server Action

Semua query & mutasi data dilakukan lewat **Server Actions** di `src/features/<fitur>/actions.ts`. Setiap action diawali cek otorisasi:

```ts
const session = await auth();
if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
if (!await hasPermissionAsync(session.user.role, "reports", "view"))
  return { success: false, error: { message: "Forbidden" } };
```

- Akses baca pakai aksi `view`, akses tulis pakai aksi `manage` (lihat `src/lib/*` & setup RBAC).
- Response dikembalikan dalam bentuk `{ success: true, data }` atau `{ success: false, error }`.

---

## Catatan & Batasan (Known Limitations)

- **`/forgot-password`** belum tersedia — link "Lupa password?" di halaman login masih menuju halaman 404.
- **Laporan Stok Bahan Baku** belum tampil di halaman Laporan. Backend `getStockReport` dan komponen `stock-report.tsx` sudah ada, tapi tabnya belum dihubungkan.
- **Riwayat Bahan Baku** hanya mencatat tipe `STOCK_IN` dan `STOCK_OUT` — tipe `ADJUSTMENT` / `OPNAME` ada di enum & label UI, tapi belum ada aksi yang membuat movement tersebut.
- **Produk bersifat display-only** — stok produk tidak pernah didecrement saat transaksi. Transaksi sebelum dukungan COGS mencatat `buyPrice: 0`; koreksi/backfill data lama perlu dilakukan manual bila HPP dibutuhkan.
- **Test otomatis (vitest)** sudah dikonfigurasi di `package.json`, namun belum ada file test yang ditulis (`npm test` berjalan tetapi tanpa test case).
- **Upload foto produk** disimpan di `public/products/` (di-`.gitignore`). Untuk production, disarankan migrasi ke penyimpanan cloud (Cloudflare R2 / S3, env `CLOUDFLARE_*` sudah disiapkan).

---

<div align="center">
  <p><strong>BertigaPos v0.1.0</strong> — Dibangun dengan Next.js 16, Prisma, dan PostgreSQL</p>
</div>
