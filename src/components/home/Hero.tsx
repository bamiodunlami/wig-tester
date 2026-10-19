import Link from "next/link";
import { HeroModel } from "./HeroModel";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blush-50 to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-12">
        <div className="max-w-xl">
          <p className="animate-fade-up text-xs font-semibold tracking-[0.25em] text-blush-600 uppercase">
            100% human hair · HD lace
          </p>
          <h1 className="animate-fade-up mt-5 font-display text-5xl leading-[1.05] [animation-delay:80ms] sm:text-6xl lg:text-7xl">
            Find your crown.
            <br />
            <span className="italic text-blush-600">Try it on</span> first.
          </h1>
          <p className="animate-fade-up mt-6 max-w-md text-lg leading-relaxed text-ink-soft [animation-delay:160ms]">
            Luxurious wigs with an undetectable hairline. Upload a selfie on any wig&apos;s page and see exactly how it
            looks on you before you buy.
          </p>
          <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-4 [animation-delay:240ms]">
            <Link
              href="/#shop"
              className="group inline-flex h-13 items-center gap-3 rounded-full bg-ink px-8 text-sm font-semibold tracking-wide text-white transition hover:bg-blush-600"
            >
              Shop now
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 transition group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M4 10h12m-5-5 5 5-5 5" />
              </svg>
            </Link>
            <span className="text-sm text-ink-muted">Free shipping over $150</span>
          </div>
          <dl className="animate-fade-up mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink/10 pt-6 [animation-delay:320ms]">
            {[
              ["100%", "Human hair"],
              ["30-day", "Easy returns"],
              ["AI", "Virtual try-on"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl">{value}</dd>
                <dd className="mt-1 text-xs text-ink-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-fade-up [animation-delay:200ms]">
          <HeroModel />
        </div>
      </div>
    </section>
  );
}
