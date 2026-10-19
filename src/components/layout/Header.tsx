"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useCart } from "@/store/cart";
import { useMounted } from "@/lib/useMounted";
import { products } from "@/lib/products";

export function Header() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const setOpen = useCart((s) => s.setOpen);
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link href="/#shop" className="hover:text-blush-600">
            Shop
          </Link>
          <Link href={`/products/${products[0].slug}#try-on`} className="hover:text-blush-600">
            Virtual try-on
          </Link>
          <Link href="/privacy" className="hover:text-blush-600">
            Photo privacy
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink-soft"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          Bag
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blush-400 px-1 text-xs font-semibold text-ink">
            {mounted ? count : 0}
          </span>
        </button>
      </div>
    </header>
  );
}
