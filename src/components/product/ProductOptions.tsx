"use client";

import { useState } from "react";
import type { Wig } from "@/lib/products";
import { useCart } from "@/store/cart";

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="mt-8">
      <legend className="text-sm font-medium">
        {label}: <span className="text-ink-muted">{value}</span>
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${
              value === o ? "border-ink bg-ink text-white" : "border-ink/15 hover:border-ink"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              name={label}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ProductOptions({ product }: { product: Wig }) {
  const [color, setColor] = useState(product.colors[0]);
  const [capSize, setCapSize] = useState(product.capSizes[1] ?? product.capSizes[0]);
  const add = useCart((s) => s.add);

  return (
    <>
      <OptionGroup label="Color" options={product.colors} value={color} onChange={setColor} />
      <OptionGroup label="Cap size" options={product.capSizes} value={capSize} onChange={setCapSize} />
      <button
        type="button"
        onClick={() => add({ slug: product.slug, color, capSize })}
        className="mt-10 h-13 w-full rounded-full bg-ink text-sm font-semibold tracking-wide text-white transition hover:bg-blush-600"
      >
        Add to bag
      </button>
    </>
  );
}
