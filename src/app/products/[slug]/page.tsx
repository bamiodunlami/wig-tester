import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";
import { Gallery } from "@/components/product/Gallery";
import { ProductOptions } from "@/components/product/ProductOptions";
import { TryOn } from "@/components/product/TryOn";
import { formatPrice } from "@/lib/site";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const details = [
    ["Length", product.length],
    ["Texture", product.texture],
    ["Lace", product.lace],
    ["Density", product.density],
  ];

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-muted">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/#shop" className="hover:text-ink">
            Wigs
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Gallery images={product.images} />

          <div className="lg:pt-4">
            {product.badge && (
              <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold tracking-wider text-blush-700 uppercase">
                {product.badge}
              </span>
            )}
            <h1 className="mt-4 font-display text-5xl leading-tight">{product.name}</h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
              {product.compareAt && (
                <span className="text-ink-muted line-through">{formatPrice(product.compareAt)}</span>
              )}
            </div>
            <p className="mt-6 leading-relaxed text-ink-soft">{product.description}</p>

            <ProductOptions product={product} />

            <a
              href="#try-on"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink text-sm font-semibold transition hover:bg-blush-100"
            >
              See it on you first — virtual try-on
            </a>

            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10">
              {details.map(([k, v]) => (
                <div key={k} className="bg-white p-4">
                  <dt className="text-xs tracking-wider text-ink-muted uppercase">{k}</dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-8 space-y-2 text-sm text-ink-soft">
              <li>✓ 100% human hair, can be dyed and heat-styled</li>
              <li>✓ Adjustable straps and combs for a secure fit</li>
              <li>✓ Free shipping over $150 · 30-day returns on unworn wigs</li>
            </ul>
          </div>
        </div>
      </section>

      <TryOn product={product} />
    </>
  );
}
