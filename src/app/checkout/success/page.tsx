import Link from "next/link";
import { ClearCart } from "./ClearCart";

export const metadata = { title: "Order confirmed" };

export default function CheckoutSuccess() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <ClearCart />
      <span className="grid h-16 w-16 place-items-center rounded-full bg-blush-400 text-2xl">✓</span>
      <h1 className="mt-6 font-display text-5xl">Thank you!</h1>
      <p className="mt-4 text-ink-soft">
        Your order is confirmed. We&apos;ll email you a receipt and tracking details as soon as it ships.
      </p>
      <Link
        href="/#shop"
        className="mt-10 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-white hover:bg-blush-600"
      >
        Keep shopping
      </Link>
    </section>
  );
}
