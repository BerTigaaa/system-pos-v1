import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import type { IconType } from "react-icons";

const footerLinks = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "#features" },
      { label: "Cara Kerja", href: "#how-it-works" },
      { label: "Harga", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Sistem",
    links: [
      { label: "Login", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Coba Demo", href: "#pricing" },
    ],
  },
];

type ContactLink = {
  label: string;
  value: string;
  href: string;
  icon: IconType;
};

const contactLinks: ContactLink[] = [
  {
    label: "Instagram",
    value: "@bertigaaa.official",
    href: "https://www.instagram.com/bertigaaa.official",
    icon: FaInstagram,
  },
  {
    label: "TikTok",
    value: "@bertigaaa.official",
    href: "https://www.tiktok.com/@bertigaaa.official",
    icon: FaTiktok,
  },
  {
    label: "Facebook",
    value: "bertigaaa.official",
    href: "https://www.facebook.com/bertigaaa.official",
    icon: FaFacebookF,
  },
  {
    label: "WhatsApp",
    value: "082381178615",
    href: "https://wa.me/6282381178615",
    icon: FaWhatsapp,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E9E4FF] bg-[#FCFBFF]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr_1.1fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/images/logo-bertigaaa-pos-horizontal.png"
                alt="BerTigaaa POS"
                width={220}
                height={74}
                className="h-20 w-auto object-contain"
              />
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-neutral-600">
              BerTigaaa POS membantu usaha mengelola penjualan, stok, kasir,
              laporan, dan operasional harian dalam satu platform yang modern,
              rapi, dan mudah digunakan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="https://wa.me/6282381178615"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6D4CFF] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(109,76,255,0.18)] transition hover:bg-[#5A3DE0] hover:-translate-y-0.5"
              >
                Konsultasi via WhatsApp
                <ArrowUpRight size={16} />
              </Link>

              <Link
                href="mailto:bertigaaa0105@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DDD6FF] bg-white px-6 py-3 text-sm font-bold text-neutral-900 shadow-sm transition hover:border-[#6D4CFF] hover:text-[#6D4CFF] hover:-translate-y-0.5"
              >
                Kirim Email
                <Mail size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-2">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-bold tracking-wide text-neutral-950">
                  {group.title}
                </h3>

                <ul className="mt-5 space-y-3">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm font-medium text-neutral-600 transition hover:text-[#6D4CFF]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wide text-neutral-950">
              Hubungi Kami
            </h3>

            <div className="mt-5 grid gap-4">
              {contactLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-[#EEE9FF] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(20,20,43,0.04)] transition hover:-translate-y-0.5 hover:border-[#D9CEFF] hover:shadow-[0_14px_32px_rgba(109,76,255,0.10)]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F0FF] text-[#6D4CFF]">
                        <Icon size={18} />
                      </span>

                      <span>
                        <span className="block text-sm font-bold text-neutral-950">
                          {item.label}
                        </span>
                        <span className="block text-xs font-medium text-neutral-500">
                          {item.value}
                        </span>
                      </span>
                    </span>

                    <ArrowUpRight
                      size={16}
                      className="text-neutral-400 transition group-hover:text-[#6D4CFF]"
                    />
                  </Link>
                );
              })}

              <Link
                href="mailto:bertigaaa0105@gmail.com"
                className="group flex items-center justify-between rounded-2xl border border-[#EEE9FF] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(20,20,43,0.04)] transition hover:-translate-y-0.5 hover:border-[#D9CEFF] hover:shadow-[0_14px_32px_rgba(109,76,255,0.10)]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F0FF] text-[#6D4CFF]">
                    <Mail size={18} />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-neutral-950">
                      Email
                    </span>
                    <span className="block text-xs font-medium text-neutral-500">
                      bertigaaa0105@gmail.com
                    </span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="text-neutral-400 transition group-hover:text-[#6D4CFF]"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[#E9E4FF] pt-6 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} BerTigaaa POS. All rights reserved.</p>

          <p>
            Built for modern business operations, not spreadsheet suffering.
          </p>
        </div>
      </div>
    </footer>
  );
}
