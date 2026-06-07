import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://posv1.bertigaaa.com"),
  title: {
    default: "BerTigaaa POS | Solusi POS Modern untuk Usaha Anda",
    template: "%s | BerTigaaa POS",
  },
  description:
    "BerTigaaa POS adalah solusi POS modern untuk mengelola penjualan, stok, laporan, multi-pengguna, dan kasir dalam satu platform.",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "BerTigaaa POS | Solusi POS Modern untuk Usaha Anda",
    description:
      "Kelola penjualan, stok, dan laporan dengan mudah dalam satu platform.",
    url: "https://posv1.bertigaaa.com",
    siteName: "BerTigaaa POS",
    images: [
      {
        url: "/images/og-bertigaaa-pos.png",
        width: 1200,
        height: 630,
        alt: "BerTigaaa POS - Solusi POS modern untuk usaha Anda",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BerTigaaa POS | Solusi POS Modern untuk Usaha Anda",
    description:
      "Kelola penjualan, stok, dan laporan dengan mudah dalam satu platform.",
    images: ["/images/twitter-bertigaaa-pos.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
