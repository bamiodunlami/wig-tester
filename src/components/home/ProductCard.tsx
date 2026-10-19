"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { formatPrice } from "@/lib/site";
import type { Wig } from "@/lib/products";

export function ProductCard({ product, index }: { product: Wig; index: number }) {
  const [main, hover] = product.images;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-blush-100 transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_24px_48px_-24px_rgba(184,90,105,0.55)]">
          <div className="absolute inset-0 mix-blend-multiply">
            <Image
              src={main.src}
              alt={main.alt}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
              className="object-cover object-top transition duration-700 group-hover:scale-[1.03] group-hover:opacity-0"
            />
            <Image
              src={hover.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
              className="object-cover object-top opacity-0 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
            />
          </div>
          {product.badge && (
            <span className="absolute top-4 left-4 rounded-full bg-ink px-3 py-1 text-[11px] font-semibold tracking-wider text-white uppercase">
              {product.badge}
            </span>
          )}
          <span className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold backdrop-blur transition group-hover:bg-blush-400">
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2m6 0h2a2 2 0 0 1 2 2v2m0 6v2a2 2 0 0 1-2 2h-2m-6 0H5a2 2 0 0 1-2-2v-2" />
              <circle cx="10" cy="10" r="3" />
            </svg>
            Try it on
          </span>
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl">{product.name}</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {product.length} · {product.texture} · {product.lace}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatPrice(product.price)}</p>
            {product.compareAt && (
              <p className="text-sm text-ink-muted line-through">{formatPrice(product.compareAt)}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
