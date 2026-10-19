import { products } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductGrid() {
  return (
    <section id="shop" className="scroll-mt-16 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-blush-600 uppercase">The collection</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Wigs worth trying on</h2>
          </div>
          <p className="max-w-sm text-ink-soft">
            Choose a style, then upload a photo on its page to see it fitted on you.
          </p>
        </div>

        <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p, i) => (
            <li key={p.slug}>
              <ProductCard product={p} index={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
