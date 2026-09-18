import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/public/animation/reveal";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  LockKeyhole,
  Package,
  ReceiptText,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
  Warehouse,
  Building2,
} from "lucide-react";

const highlights = [
  "Manajemen stok real-time",
  "Multi-role sesuai hak akses",
  "Laporan penjualan otomatis",
  "POS web untuk kasir & owner",
];

const featureCards = [
  {
    title: "Dashboard Bisnis",
    description:
      "Pantau penjualan hari ini, transaksi, rata-rata transaksi, stok bahan baku menipis, dan grafik penjualan 7 hari.",
    icon: LayoutDashboard,
  },
  {
    title: "POS & Order",
    description:
      "Kelola pesanan, pembayaran, meja, cart, diskon, metode pembayaran, dan cetak struk dari satu layar.",
    icon: Store,
  },
  {
    title: "Shift Kasir",
    description:
      "Buka dan tutup shift dengan saldo awal, saldo akhir, catatan, total penjualan, dan riwayat shift.",
    icon: ClipboardList,
  },
  {
    title: "Produk & Kategori",
    description:
      "Tambah produk, SKU, barcode, gambar, kategori, harga jual, dan status produk.",
    icon: Package,
  },
  {
    title: "Gudang & Stok",
    description:
      "Pantau stok bahan baku, stok masuk, stok keluar, batch, tanggal kadaluwarsa, dan supplier.",
    icon: Warehouse,
  },
  {
    title: "Supplier",
    description:
      "Kelola data supplier seperti nama, telepon, email, alamat, dan kebutuhan inventori bisnis.",
    icon: Building2,
  },
  {
    title: "Transaksi & Refund",
    description:
      "Lihat invoice, kasir, pelanggan, total, metode bayar, status transaksi, detail, refund, dan cetak struk.",
    icon: ReceiptText,
  },
  {
    title: "Keuangan",
    description:
      "Kelola kas masuk, kas keluar, dan rekap laba rugi untuk membaca kondisi bisnis dengan lebih jelas.",
    icon: WalletCards,
  },
  {
    title: "Laporan",
    description:
      "Export laporan penjualan harian, bulanan, tahunan, produk terlaris, stok bahan baku, dan aktivitas kasir.",
    icon: FileSpreadsheet,
  },
  {
    title: "Karyawan",
    description:
      "Kelola akun karyawan, role, status aktif/nonaktif, reset password, dan akses operasional.",
    icon: Users,
  },
  {
    title: "Audit Log",
    description:
      "Lihat jejak aktivitas user, modul, aksi, deskripsi, waktu, dan IP address untuk kontrol sistem.",
    icon: ShieldCheck,
  },
  {
    title: "Notifikasi",
    description:
      "Terima notifikasi stok bahan baku menipis, pesanan baru, refund, perubahan data, login baru, dan aktivitas penting.",
    icon: Bell,
  },
];

const roles = [
  {
    role: "Super Admin",
    description:
      "Akses penuh untuk mengelola sistem, user, role, fitur, dan kontrol data.",
  },
  {
    role: "Owner",
    description:
      "Pantau operasional bisnis, laporan, transaksi, keuangan, dan karyawan.",
  },
  {
    role: "Cashier",
    description: "Fokus ke POS, transaksi, shift, dan kebutuhan kasir harian.",
  },
  {
    role: "Warehouse",
    description:
      "Kelola bahan baku, stok masuk/keluar, supplier, dan pergerakan inventori.",
  },
  {
    role: "Finance",
    description:
      "Kelola laporan, kas masuk, kas keluar, transaksi, dan rekap keuangan.",
  },
];

const steps = [
  {
    title: "Setup Bisnis",
    description:
      "Masukkan data bisnis, pajak, struk, meja, karyawan, dan konfigurasi POS.",
  },
  {
    title: "Tambah Produk",
    description:
      "Input produk, kategori, harga, barcode, dan status.",
  },
  {
    title: "Mulai Transaksi",
    description:
      "Kasir bisa buka shift, proses order, menerima pembayaran, dan cetak struk.",
  },
  {
    title: "Pantau Laporan",
    description:
      "Owner dan finance bisa membaca laporan penjualan, stok, kas, dan aktivitas kasir.",
  },
];

const faqs = [
  {
    question: "Apakah BerTigaaa POS cocok untuk cafe dan retail?",
    answer:
      "Ya. Sistem ini cocok untuk cafe, toko retail, UMKM, dan bisnis yang butuh transaksi, stok, laporan, dan kasir.",
  },
  {
    question: "Apakah bisa multi-user?",
    answer:
      "Bisa. Sistem mendukung role Super Admin, Owner, Cashier, Warehouse, dan Finance.",
  },
  {
    question: "Apakah bisa export laporan?",
    answer:
      "Bisa. Laporan dapat diexport ke Excel dan PDF untuk kebutuhan operasional dan arsip bisnis.",
  },
  {
    question: "Apakah ada fitur stok menipis?",
    answer:
      "Ada. Sistem memberi notifikasi ketika stok bahan baku mendekati minimum atau habis.",
  },
];

function getRevealDelay(index: number): 100 | 200 | 300 | 400 {
  const delays = [100, 200, 300, 400] as const;
  return delays[index % delays.length];
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-white">
      <section className="relative border-b border-[#EEE9FF] bg-[radial-gradient(circle_at_top_right,#EEE9FF_0%,#FFFFFF_42%,#FFFFFF_100%)]">
        <div className="absolute left-[-120px] top-24 h-72 w-72 rounded-full bg-[#F3F0FF] blur-3xl animate-soft-pulse" />
        <div className="absolute right-[-160px] top-12 h-96 w-96 rounded-full bg-[#E4DDFF] blur-3xl animate-soft-pulse" />

        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-[#DDD6FF] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6D4CFF] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#6D4CFF]" />
              BerTigaaa POS
            </div>

            <h1 className="animate-fade-up mt-6 max-w-3xl text-4xl font-black tracking-tight text-neutral-950 [animation-delay:120ms] sm:text-5xl lg:text-6xl">
              Sistem POS Modern untuk Bisnis yang Mau Rapi.
            </h1>

            <p className="animate-fade-up mt-6 max-w-2xl text-base leading-8 text-neutral-600 [animation-delay:220ms] sm:text-lg">
              Kelola transaksi, stok, kasir, meja, laporan, keuangan, dan
              operasional bisnis dalam satu dashboard yang cepat, modern, dan
              mudah digunakan.
            </p>

            <div className="animate-fade-up mt-8 flex flex-col gap-3 [animation-delay:320ms] sm:flex-row">
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6D4CFF] px-7 py-4 text-sm font-bold text-white shadow-[0_16px_40px_rgba(109,76,255,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5A3DE0]"
              >
                Lihat Paket
                <ArrowRight size={18} />
              </Link>

              <Link
                href="https://wa.me/6282381178615"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DDD6FF] bg-white px-7 py-4 text-sm font-bold text-neutral-950 shadow-sm transition hover:-translate-y-0.5 hover:border-[#6D4CFF] hover:text-[#6D4CFF]"
              >
                Konsultasi WhatsApp
              </Link>
            </div>

            <div className="animate-fade-up mt-8 grid gap-3 [animation-delay:420ms] sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-semibold text-neutral-700"
                >
                  <CheckCircle2 size={18} className="text-[#6D4CFF]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-float-slow">
            <div className="absolute inset-8 rounded-[3rem] bg-[#6D4CFF]/10 blur-3xl animate-soft-pulse" />

            <Image
              src="/images/hero-bertigaaa-pos-mockup.png"
              alt="BerTigaaa POS dashboard mockup"
              width={1672}
              height={941}
              priority
              className="relative w-full rounded-[2rem] object-contain drop-shadow-[0_30px_60px_rgba(20,20,43,0.16)]"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-[#EEE9FF] bg-white py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            ["5", "Role utama"],
            ["14+", "Modul sistem"],
            ["23+", "Titik notifikasi"],
            ["Excel/PDF", "Export laporan"],
          ].map(([value, label], index) => (
            <Reveal key={label} delay={getRevealDelay(index)}>
              <div className="landing-card rounded-3xl border border-[#EEE9FF] bg-[#FCFBFF] px-6 py-6 text-center shadow-[0_10px_30px_rgba(20,20,43,0.04)] hover:shadow-[0_20px_50px_rgba(109,76,255,0.08)]">
                <p className="text-3xl font-black text-neutral-950">{value}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  {label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6D4CFF]">
                Fitur Lengkap
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Semua kebutuhan operasional dalam satu sistem.
              </h2>
              <p className="mt-5 text-base leading-7 text-neutral-600">
                Dari transaksi kasir sampai laporan keuangan, BerTigaaa POS
                dibuat untuk membantu bisnis berjalan lebih rapi tanpa drama
                spreadsheet yang tiap buka bikin batin retak.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Reveal key={feature.title} delay={getRevealDelay(index)}>
                  <div className="group landing-card landing-glow rounded-3xl border border-[#EEE9FF] bg-white p-6 shadow-[0_10px_30px_rgba(20,20,43,0.04)] hover:border-[#D9CEFF] hover:shadow-[0_20px_50px_rgba(109,76,255,0.10)]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0FF] text-[#6D4CFF] transition group-hover:bg-[#6D4CFF] group-hover:text-white">
                      <Icon size={22} />
                    </div>

                    <h3 className="mt-5 text-lg font-black text-neutral-950">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-neutral-600">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-[#EEE9FF] bg-[#FCFBFF] py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <Reveal>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6D4CFF]">
                Cara Kerja
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Dari setup sampai laporan, alurnya dibuat sederhana.
              </h2>
              <p className="mt-5 text-base leading-8 text-neutral-600">
                Sistem POS tidak harus bikin owner merasa sedang belajar ilmu
                roket. BerTigaaa POS dibuat supaya bisnis bisa cepat jalan,
                transaksi lancar, dan data tetap kebaca.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={getRevealDelay(index)}>
                <div className="landing-card rounded-3xl border border-[#EEE9FF] bg-white p-6 shadow-[0_10px_30px_rgba(20,20,43,0.04)] hover:shadow-[0_20px_50px_rgba(109,76,255,0.08)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6D4CFF] text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <h3 className="mt-5 text-lg font-black text-neutral-950">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6D4CFF]">
                  Role & Hak Akses
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                  Setiap tim punya akses sesuai kebutuhan.
                </h2>

                <p className="mt-5 text-base leading-8 text-neutral-600">
                  Owner tidak perlu kasih akses semua orang ke semua fitur.
                  Kasir fokus transaksi, warehouse fokus stok, finance fokus
                  laporan. Lebih aman, lebih rapi, lebih tidak “siapa yang ubah
                  data ini?”.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-4">
              {roles.map((item, index) => (
                <Reveal key={item.role} delay={getRevealDelay(index)}>
                  <div className="landing-card rounded-3xl border border-[#EEE9FF] bg-[#FCFBFF] p-5 shadow-[0_10px_30px_rgba(20,20,43,0.04)] hover:shadow-[0_20px_50px_rgba(109,76,255,0.08)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F0FF] text-[#6D4CFF]">
                        <LockKeyhole size={20} />
                      </div>

                      <div>
                        <h3 className="text-base font-black text-neutral-950">
                          {item.role}
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-neutral-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="relative overflow-hidden bg-[#111827] py-24"
      >
        <div className="absolute left-[-140px] top-[-140px] h-80 w-80 rounded-full bg-[#6D4CFF]/30 blur-3xl animate-soft-pulse" />
        <div className="absolute bottom-[-160px] right-[-140px] h-96 w-96 rounded-full bg-[#6D4CFF]/20 blur-3xl animate-soft-pulse" />

        <Reveal>
          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
              <CreditCard size={26} />
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Siap bikin operasional bisnis lebih rapi?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-neutral-300">
              Diskusikan kebutuhan bisnis Anda dan lihat apakah BerTigaaa POS
              cocok untuk workflow kasir, stok, laporan, dan tim Anda.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="https://wa.me/6282381178615"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6D4CFF] px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#5A3DE0]"
              >
                Konsultasi Sekarang
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Masuk Dashboard
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="faq" className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <Reveal>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6D4CFF]">
                FAQ
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Pertanyaan yang biasanya muncul sebelum mulai.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4">
            {faqs.map((faq, index) => (
              <Reveal key={faq.question} delay={getRevealDelay(index)}>
                <div className="landing-card rounded-3xl border border-[#EEE9FF] bg-[#FCFBFF] p-6 hover:shadow-[0_20px_50px_rgba(109,76,255,0.08)]">
                  <h3 className="text-base font-black text-neutral-950">
                    {faq.question}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    {faq.answer}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
