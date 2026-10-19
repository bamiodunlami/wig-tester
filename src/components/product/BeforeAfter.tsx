"use client";

import { useState } from "react";

/* eslint-disable @next/next/no-img-element -- blob: URLs can't go through next/image */
export function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [split, setSplit] = useState(50);

  return (
    <div className="relative max-h-[70svh] overflow-hidden rounded-2xl select-none">
      <img src={after} alt={alt} className="block max-h-[70svh] w-auto max-w-full" />
      <img
        src={before}
        alt="Your original photo"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold shadow">
          ⇆
        </span>
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white">
        Before
      </span>
      <span className="absolute top-3 right-3 rounded-full bg-blush-400 px-2.5 py-1 text-[11px] font-semibold">
        After
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label="Compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
