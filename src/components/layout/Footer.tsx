import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "./Logo";
import { products } from "@/lib/products";
import { site } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

const socials = [
  {
    label: "Instagram",
    href: site.socials.instagram,
    path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5h.01",
  },
  {
    label: "TikTok",
    href: site.socials.tiktok,
    path: "M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.6 2.4 4.5 5 5",
  },
  {
    label: "Facebook",
    href: site.socials.facebook,
    path: "M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z",
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-white/70">{site.tagline}</p>
          <NewsletterForm />
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-blush-300 uppercase">Shop</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>
              <Link href="/#shop" className="hover:text-blush-300">
                All wigs
              </Link>
            </li>
            {products.slice(0, 3).map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="hover:text-blush-300">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-blush-300 uppercase">Help</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>
              <Link href={`/products/${products[0].slug}#try-on`} className="hover:text-blush-300">
                How try-on works
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-blush-300">
                Photo privacy
              </Link>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-blush-300">
                Contact us
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-blush-300 uppercase">Follow</h2>
          <ul className="mt-4 flex gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 transition hover:border-blush-400 hover:bg-blush-400 hover:text-ink"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-white/50 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>
            © <CopyrightYear /> {site.name}. All rights reserved.
          </p>
          <p>Free shipping over $150 · 30-day returns</p>
        </div>
      </div>
    </footer>
  );
}

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
