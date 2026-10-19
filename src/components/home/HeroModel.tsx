"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

// Ordered by where the cursor is: far left → the model looks left, far right → she looks right.
const FRAMES = [
  { src: "/hero/profile-left.jpg", label: "Side" },
  { src: "/hero/three-quarter-left.jpg", label: "Three-quarter" },
  { src: "/hero/front.jpg", label: "Front" },
  { src: "/hero/three-quarter-right.jpg", label: "Three-quarter" },
  { src: "/hero/profile-right.jpg", label: "Side" },
];
const TOP_DOWN = { src: "/hero/top-down.jpg", label: "Parting" };
const FRONT_INDEX = 2;
const IDLE_MS = 3500;

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Fully visible near its own position, cross-fading over a short band to its neighbours. */
function Frame({
  index,
  position,
  src,
  priority,
}: {
  index: number;
  position: MotionValue<number>;
  src: string;
  priority: boolean;
}) {
  const opacity = useTransform(position, (p) => clamp((0.65 - Math.abs(p - index)) / 0.3));
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        loading={priority ? undefined : "eager"}
        sizes="(min-width: 1024px) 34vw, 80vw"
        className="object-cover"
      />
    </motion.div>
  );
}

export function HeroModel() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Cursor position relative to the model, roughly -1…1 on each axis.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 });

  const position = useTransform(sx, [-1, 1], [0, FRAMES.length - 1]);
  const topDownOpacity = useTransform(sy, (y) => clamp((-y - 0.45) / 0.3));
  const rotateY = useTransform(sx, [-1, 1], [-7, 7]);
  const rotateX = useTransform(sy, [-1, 1], [5, -5]);
  const glowX = useTransform(sx, [-1, 1], [40, -40]);
  const glowY = useTransform(sy, [-1, 1], [24, -24]);
  const sheenX = useTransform(sx, [-1, 1], ["10%", "90%"]);

  const [label, setLabel] = useState({ index: FRONT_INDEX, top: false });
  const update = () => {
    const index = Math.round(clamp(position.get(), 0, FRAMES.length - 1));
    const top = topDownOpacity.get() > 0.5;
    setLabel((l) => (l.index === index && l.top === top ? l : { index, top }));
  };
  useMotionValueEvent(position, "change", update);
  useMotionValueEvent(topDownOpacity, "change", update);

  useEffect(() => {
    if (reduceMotion) {
      mx.set(0);
      my.set(0);
      return;
    }

    let lastMove = -Infinity;
    let raf = 0;
    const start = performance.now();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.3; // around the head
      mx.set(clamp((e.clientX - cx) / (window.innerWidth * 0.4), -1, 1));
      my.set(clamp((e.clientY - cy) / (window.innerHeight * 0.4), -1, 1));
      lastMove = performance.now();
    };

    // With no mouse (touch screens, or the cursor resting), turn slowly on its own.
    const tick = (now: number) => {
      if (now - lastMove > IDLE_MS) {
        const t = (now - start) / 1000;
        mx.set(Math.sin(t * 0.7) * 0.95);
        my.set(Math.max(0, Math.sin(t * 0.35)) * -0.15);
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion, mx, my]);

  const caption = label.top ? TOP_DOWN.label : FRAMES[label.index].label;

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,calc(78svh*0.558))]" style={{ perspective: 1200 }}>
      {/* Soft blush glow that drifts against the cursor for depth. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-[6%] -z-10 rounded-full bg-blush-300/70 blur-3xl"
        style={{ x: glowX, y: glowY }}
      />

      <motion.div
        ref={ref}
        className="relative aspect-[768/1376] w-full overflow-hidden rounded-[2.5rem] bg-blush-100"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        role="img"
        aria-label="Model wearing the Signature Body Wave wig. Move your cursor to see it from every angle."
      >
        {/* Multiply turns the studio's white backdrop into the blush card colour. */}
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{ maskImage: "linear-gradient(to bottom, black 82%, transparent)" }}
        >
          {FRAMES.map((f, i) => (
            <Frame key={f.src} index={i} position={position} src={f.src} priority={i === FRONT_INDEX} />
          ))}
          <motion.div className="absolute inset-0" style={{ opacity: topDownOpacity }}>
            <Image
              src={TOP_DOWN.src}
              alt=""
              fill
              loading="eager"
              sizes="(min-width: 1024px) 34vw, 80vw"
              className="object-cover"
            />
          </motion.div>
        </div>

        {/* A highlight that sweeps across the hair as the cursor moves. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent mix-blend-soft-light"
          style={{ left: sheenX }}
        />
      </motion.div>

      <div className="mt-5 flex items-center justify-center gap-3 text-xs font-medium tracking-[0.18em] text-ink-muted uppercase">
        <div className="flex gap-1.5" aria-hidden="true">
          {FRAMES.map((f, i) => (
            <span
              key={f.src}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                !label.top && label.index === i ? "w-6 bg-ink" : "w-1.5 bg-ink/25"
              }`}
            />
          ))}
        </div>
        <span className="w-28">{caption} view</span>
      </div>
    </div>
  );
}
