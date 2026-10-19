"use client";

import Image from "next/image";
import { useState } from "react";
import type { Wig } from "@/lib/products";

export function Gallery({ images }: { images: Wig["images"] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      <ul className="flex gap-3 sm:flex-col" aria-label="Product images">
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={active === i}
              className={`relative block h-24 w-18 overflow-hidden rounded-xl bg-blush-100 ring-2 transition ${
                active === i ? "ring-ink" : "ring-transparent hover:ring-blush-400"
              }`}
            >
              <Image src={img.src} alt="" fill sizes="72px" className="object-cover object-top mix-blend-multiply" />
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0 flex-1">
        <div className="relative mx-auto aspect-[4/5] max-h-[78svh] overflow-hidden rounded-[2rem] bg-blush-100">
          {images.map((img, i) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={`object-cover object-top mix-blend-multiply transition-opacity duration-500 ${
                active === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
