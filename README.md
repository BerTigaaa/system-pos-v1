<div align="center">
  <h1>BertigaPos</h1>
  <p>Sistem POS (Point of Sale) modern untuk retail & UMKM — berbasis web, multi-role, real-time.</p>
</div>

---

## Daftar Isi

- [Cara Clone & Setup](#cara-clone--setup)
- [Tech Stack](#tech-stack)
- [Role & Hak Akses](#role--hak-akses)
- [Halaman & Fitur](#halaman--fitur)
  - [Dashboard](#1-dashboard)
  - [POS (Point of Sale)](#2-pos)
  - [Shift](#3-shift)
  - [Produk](#4-produk)
  - [Gudang](#5-gudang)
  - [Supplier](#6-supplier)
  - [Transaksi](#7-transaksi)
  - [Keuangan](#8-keuangan)
  - [Laporan](#9-laporan)
  - [Karyawan](#10-karyawan)
  - [Admin](#11-admin)
  - [Audit Log](#12-audit-log)
  - [Notifikasi](#13-notifikasi)
  - [Pengaturan](#14-pengaturan)
- [Notifikasi](#notifikasi)
- [Permission Matrix](#permission-matrix)

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

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript 5, TailwindCSS 3, Ant Design 5, Zustand 4, Recharts
- **Backend:** Next.js Server Actions, Prisma ORM 5, PostgreSQL 16
- **Auth:** NextAuth v5 (Auth.js), bcryptjs, RBAC middleware
- **Deploy:** Vercel / Railway / VPS

---

## Role & Hak Akses

Ada **5 role** dengan akses berbeda:

| Role | Deskripsi |
|------|-----------|
| **SUPER_ADMIN** | Developer/system admin — full akses ke semua fitur |
| **OWNER** | Pemilik bisnis — full akses data bisnis, kecuali admin sistem |
| **CASHIER** | Kasir — POS, transaksi, shift, dashboard |
| **WAREHOUSE** | Gudang — produk, stok, supplier, inventori |
| **FINANCE** | Keuangan — laporan, kas masuk/keluar, rekap |

---

## Halaman & Fitur

### 1. Dashboard

**Akses:** Semua role

**Tampilan:**
- Greeting + user info
- 4 kartu statistik: Penjualan Hari Ini, Jumlah Transaksi, Rata-rata Transaksi, Total Produk
- Grafik penjualan 7 hari (area chart)
- Daftar stok menipis (stock ≤ min_stock)
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
- Klik produk → tambah ke cart
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
- **"Tutup Shift"** — modal input saldo akhir + catatan

> Shift harus dibuka sebelum bertransaksi di POS.

---

### 4. Produk

**Akses:** SUPER_ADMIN, OWNER, **WAREHOUSE**

**Tampilan:**
- Tabel produk: gambar, nama+SKU, kategori, harga jual, stok, status (aktif/nonaktif)

**Aksi:**
- **"Tambah Produk"** — form: nama, SKU (auto/manual), barcode, kategori, satuan (pcs/kg/liter/box), harga beli, harga jual, stok, min_stok, deskripsi, gambar
- **Edit** — form sama terisi
- **Hapus** — soft delete (konfirmasi)
- **Toggle aktif/nonaktif** — inline switch
- **"Kelola Kategori"** — tambah/edit/hapus kategori

---

### 5. Gudang

**Akses:** SUPER_ADMIN, OWNER, **WAREHOUSE**

#### Tab: Riwayat Stok
**Tampilan:** Riwayat pergerakan stok (waktu, produk, tipe, qty ±, stok sebelum/sesudah, alasan, user)
**Filter:** Search nama, filter tipe (PURCHASE / SALE / MANUAL_OUT / ADJUSTMENT / OPNAME / RETURN)

#### Tab: Penyesuaian Stok
**Aksi:**
- Pilih produk, pilih tipe (Pembelian/Manual Keluar/Penyesuaian/Retur), input qty + alasan → Simpan

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
- **"Refund"** (khusus SUPER_ADMIN / OWNER) — pilih item, qty, alasan → refund otomatis balikkan stok
- **"Cetak Struk"**
- Export Excel & PDF

---

### 8. Keuangan

**Akses:** SUPER_ADMIN, OWNER, **FINANCE**

#### Tab: Kas Masuk
**Tampilan:** Tabel pemasukan: tanggal, kategori, deskripsi, jumlah (hijau)
**Aksi:** Tambah, Edit, Hapus — filter kategori & tanggal

#### Tab: Kas Keluar
**Tampilan:** Tabel pengeluaran: jumlah (merah)
**Aksi:** Tambah, Edit, Hapus — filter kategori & tanggal

#### Tab: Rekap (P&L)
**Tampilan:** Kartu statistik: Penjualan, Kas Masuk, Total Pendapatan, HPP, Laba Kotor, Kas Keluar, Laba Bersih
**Filter:** Bulan & Tahun

---

### 9. Laporan

**Akses:** SUPER_ADMIN, OWNER, **FINANCE**

| Tab | Isi |
|-----|-----|
| Penjualan Harian | Breakdown per jam + total — filter tanggal |
| Penjualan Bulanan | Rekap bulanan — filter bulan & tahun |
| Penjualan Tahunan | Rekap tahunan — filter tahun |
| Produk Terlaris | Top produk — filter periode & kategori |
| Stok Barang | Laporan stok — filter kategori & status |
| Aktivitas Kasir | Aktivitas per kasir — filter kasir, periode, shift |

**Aksi:** Export Excel (.xlsx) & PDF (.pdf) di setiap tab.

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
- Stok menipis / habis → Owner, Warehouse
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

## Notifikasi

Notifikasi dikirim otomatis dari **23 titik** di seluruh modul:

| Tipe Notifikasi | Dikirim ke | Saat |
|----------------|-----------|------|
| `LOW_STOCK` | Owner, Warehouse | Stok ≤ min_stok |
| `OUT_OF_STOCK` | Owner, Warehouse | Stok = 0 |
| `REFUND_SUCCESS` | Owner, Finance | Refund berhasil |
| `STOCK_ADJUSTED` | Owner | Stok disesuaikan |
| `ORDER_CREATED` | Cashier, Owner | Pesanan baru masuk |
| `ORDER_STATUS_CHANGED` | Cashier, Owner | Status pesanan berubah |
| `CASH_FLOW_CREATED` | Owner, Finance | Kas masuk/keluar baru |
| `EMPLOYEE_CREATED` | Owner | Karyawan baru ditambahkan |
| `EMPLOYEE_PASSWORD_RESET` | Owner | Password karyawan direset |
| `USER_ROLE_CHANGED` | Owner | Role user diubah |
| `SUPPLIER_CREATED` | Owner, Warehouse | Supplier baru |
| dan 12 tipe lainnya | — | — |

---

## Permission Matrix

| Modul | SUPER_ADMIN | OWNER | CASHIER | WAREHOUSE | FINANCE |
|-------|:-----------:|:-----:|:-------:|:---------:|:-------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| POS | ✅ | ✅ | ✅ | ❌ | ❌ |
| Shift | ✅ | ✅ | ✅ | ❌ | ❌ |
| Produk | ✅ | ✅ | ❌ | ✅ (kecuali hapus) | ❌ |
| Gudang | ✅ | ✅ | ❌ | ✅ (kecuali hapus) | ❌ |
| Supplier | ✅ | ✅ | ❌ | ✅ (kecuali hapus) | ❌ |
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

<div align="center">
  <p><strong>BertigaPos v2.0</strong> — Dibangun dengan Next.js 15, Prisma, dan PostgreSQL</p>
</div>
