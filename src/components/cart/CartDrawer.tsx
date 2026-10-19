"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/store/cart";
import { getProduct } from "@/lib/products";
import { formatPrice } from "@/lib/site";
import { useMounted } from "@/lib/useMounted";

export function CartDrawer() {
  const { items, open, setOpen, setQuantity, remove } = useCart();
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const lines = mounted
    ? items.flatMap((item, index) => {
        const product = getProduct(item.slug);
        return product ? [{ item, index, product }] : [];
      })
    : [];
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.item.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h2 className="font-display text-2xl">Your bag</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush-100"
                aria-label="Close bag"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-ink-muted">Your bag is empty.</p>
                <Link
                  href="/#shop"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-blush-600"
                >
                  Browse wigs
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
                  {lines.map(({ item, index, product }) => (
                    <li key={`${item.slug}-${item.color}-${item.capSize}`} className="flex gap-4 py-5">
                      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-blush-100">
                        <Image
                          src={product.images[0].src}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover object-top mix-blend-multiply"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={() => setOpen(false)}
                            className="font-medium hover:text-blush-600"
                          >
                            {product.name}
                          </Link>
                          <span className="font-semibold">{formatPrice(product.price * item.quantity)}</span>
                        </div>
                        <p className="mt-1 text-xs text-ink-muted">
                          {product.length} · {item.color} · {item.capSize}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="inline-flex items-center rounded-full border border-ink/15">
                            <button
                              type="button"
                              onClick={() => setQuantity(index, item.quantity - 1)}
                              className="h-8 w-8 rounded-full hover:bg-blush-100"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(index, item.quantity + 1)}
                              className="h-8 w-8 rounded-full hover:bg-blush-100"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-xs text-ink-muted underline hover:text-ink"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-ink/10 px-6 py-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">Shipping and taxes calculated at checkout.</p>
                  {/* Payments aren't connected yet; this becomes the checkout button later. */}
                  <button
                    type="button"
                    disabled
                    className="mt-5 h-12 w-full cursor-not-allowed rounded-full bg-ink text-sm font-semibold text-white opacity-50"
                  >
                    Checkout coming soon
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
