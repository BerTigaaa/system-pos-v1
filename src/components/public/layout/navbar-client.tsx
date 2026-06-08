"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type NavbarClientProps = {
  isLoggedIn: boolean;
};

const navItems = [
  {
    label: "Fitur",
    href: "#features",
  },
  {
    label: "Cara Kerja",
    href: "#how-it-works",
  },
  {
    label: "Harga",
    href: "#pricing",
  },
  {
    label: "FAQ",
    href: "#faq",
  },
];

export default function NavbarClient({ isLoggedIn }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={closeMenu} className="flex items-center">
          <Image
            src="/logo-bertigaaa-pos-horizontal.png"
            alt="BerTigaaa POS"
            width={220}
            height={74}
            priority
            className="h-20w-auto object-contain"
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-neutral-600 transition hover:text-[#6D4CFF]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="bg-[#6D4CFF] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#5A3DE0]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-3 text-sm font-bold text-neutral-700 transition hover:text-[#6D4CFF]"
              >
                Login
              </Link>

              <Link
                href="#pricing"
                className="bg-[#6D4CFF] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#5A3DE0]"
              >
                Lihat Paket
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-900 transition hover:border-[#6D4CFF] hover:text-[#6D4CFF] lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-neutral-200 bg-white px-4 py-5 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="px-3 py-3 text-sm font-bold text-neutral-700 transition hover:bg-[#F3F0FF] hover:text-[#6D4CFF]"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-5">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="bg-[#6D4CFF] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#5A3DE0]"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="border border-neutral-300 px-5 py-3 text-center text-sm font-bold text-neutral-900 transition hover:border-[#6D4CFF] hover:text-[#6D4CFF]"
                  >
                    Login
                  </Link>

                  <Link
                    href="#pricing"
                    onClick={closeMenu}
                    className="bg-[#6D4CFF] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#5A3DE0]"
                  >
                    Lihat Paket
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
