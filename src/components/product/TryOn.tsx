"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Wig } from "@/lib/products";
import {
  NO_ADJUSTMENTS,
  FaceError,
  canvasToBlob,
  detectFace,
  drawFitted,
  loadPhoto,
  preloadFaceModel,
  type Adjustments,
  type FaceAnchors,
} from "@/lib/tryon";
import { useCart } from "@/store/cart";
import { BeforeAfter } from "./BeforeAfter";

type Stage =
  | { name: "empty" }
  | { name: "detecting" }
  | { name: "ready"; photo: HTMLCanvasElement; face: FaceAnchors }
  | { name: "error"; message: string };

type Ai =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "done"; url: string; before: string }
  | { name: "error"; message: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const SLIDERS: { key: keyof Adjustments; label: string; min: number; max: number; step: number }[] = [
  { key: "scale", label: "Size", min: 0.8, max: 1.25, step: 0.01 },
  { key: "y", label: "Up / down", min: -0.6, max: 0.6, step: 0.01 },
  { key: "x", label: "Left / right", min: -0.5, max: 0.5, step: 0.01 },
  { key: "rotate", label: "Tilt", min: -12, max: 12, step: 0.5 },
];

export function TryOn({ product }: { product: Wig }) {
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<Stage>({ name: "empty" });
  const [adj, setAdj] = useState<Adjustments>(NO_ADJUSTMENTS);
  const [ai, setAi] = useState<Ai>({ name: "idle" });
  const [view, setView] = useState<"instant" | "ai">("instant");
  const [dragging, setDragging] = useState(false);
  const [overlay, setOverlay] = useState<HTMLImageElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const add = useCart((s) => s.add);

  useEffect(() => {
    const img = new Image();
    img.src = product.overlay.src;
    img.decode().then(
      () => setOverlay(img),
      () => {},
    );
  }, [product.overlay.src]);

  // Draw the instant preview whenever the photo, overlay or sliders change.
  useEffect(() => {
    if (stage.name !== "ready" || !overlay || !canvasRef.current) return;
    drawFitted(canvasRef.current, stage.photo, stage.face, overlay, product.overlay.anchors, adj);
  }, [stage, overlay, adj, product.overlay.anchors, view]);

  // Release the AI result's object URLs when they're replaced or the page closes.
  useEffect(() => {
    if (ai.name !== "done") return;
    return () => {
      URL.revokeObjectURL(ai.url);
      URL.revokeObjectURL(ai.before);
    };
  }, [ai]);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStage({ name: "error", message: "That file isn't an image. Please choose a JPG, PNG or WebP photo." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStage({ name: "error", message: "That photo is over 15 MB. Please choose a smaller one." });
      return;
    }
    setStage({ name: "detecting" });
    setAi({ name: "idle" });
    setView("instant");
    setAdj(NO_ADJUSTMENTS);
    try {
      const photo = await loadPhoto(file);
      const face = await detectFace(photo);
      setStage({ name: "ready", photo, face });
    } catch (e) {
      const message =
        e instanceof FaceError
          ? e.message
          : "We couldn't read that photo. Try a different one, or a JPG/PNG if it's an iPhone HEIC.";
      if (!(e instanceof FaceError)) console.error(e);
      setStage({ name: "error", message });
    }
  }, []);

  async function generateAi() {
    if (stage.name !== "ready") return;
    setAi({ name: "loading" });
    setView("ai");
    try {
      const photoBlob = await canvasToBlob(stage.photo);
      const form = new FormData();
      form.set("photo", photoBlob, "photo.jpg");
      form.set("slug", product.slug);
      const res = await fetch("/api/try-on", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "The AI fitting didn't work this time. Please try again.");
      }
      const result = await res.blob();
      setAi({ name: "done", url: URL.createObjectURL(result), before: URL.createObjectURL(photoBlob) });
    } catch (e) {
      setAi({ name: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  function download() {
    const a = document.createElement("a");
    a.download = `${product.slug}-try-on.${view === "ai" && ai.name === "done" ? "png" : "jpg"}`;
    if (view === "ai" && ai.name === "done") {
      a.href = ai.url;
    } else if (canvasRef.current) {
      a.href = canvasRef.current.toDataURL("image/jpeg", 0.92);
    } else return;
    a.click();
  }

  const openPicker = (input: HTMLInputElement | null) => {
    if (!consent) return;
    preloadFaceModel();
    input?.click();
  };

  return (
    <section id="try-on" className="scroll-mt-16 bg-blush-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.25em] text-blush-600 uppercase">Virtual try-on</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">See the {product.name} on you</h2>
          <p className="mt-4 text-ink-soft">
            Upload a selfie and we&apos;ll fit the wig to your head instantly. Then create a realistic AI version that
            blends the hairline, lighting and your skin tone.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Preview area */}
          <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-ink/5">
            {stage.name === "ready" ? (
              <div className="flex h-full flex-col">
                {ai.name !== "idle" && (
                  <div className="flex gap-1 p-3" role="tablist" aria-label="Preview type">
                    {(["instant", "ai"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={view === v}
                        onClick={() => setView(v)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          view === v ? "bg-ink text-white" : "hover:bg-blush-100"
                        }`}
                      >
                        {v === "instant" ? "Instant preview" : "Realistic AI fit"}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative grid min-h-80 flex-1 place-items-center bg-blush-100/60 p-3">
                  {view === "instant" && (
                    <canvas
                      ref={canvasRef}
                      className="max-h-[70svh] w-auto max-w-full rounded-2xl"
                      aria-label={`Your photo with the ${product.name} placed on your head`}
                    />
                  )}
                  {view === "ai" && ai.name === "loading" && <AiLoading />}
                  {view === "ai" && ai.name === "done" && (
                    <BeforeAfter before={ai.before} after={ai.url} alt={`You wearing the ${product.name}`} />
                  )}
                  {view === "ai" && ai.name === "error" && (
                    <div role="alert" className="max-w-sm p-8 text-center">
                      <p className="font-medium">AI fitting unavailable</p>
                      <p className="mt-2 text-sm text-ink-soft">{ai.message}</p>
                      <button type="button" onClick={() => setView("instant")} className="mt-4 text-sm underline">
                        Back to instant preview
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (consent) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (consent) handleFile(e.dataTransfer.files[0]);
                }}
                className={`flex min-h-[28rem] flex-col items-center justify-center gap-5 border-2 border-dashed p-8 text-center transition ${
                  dragging ? "border-blush-500 bg-blush-100" : "border-transparent"
                }`}
              >
                {stage.name === "detecting" ? (
                  <>
                    <span
                      className="h-10 w-10 animate-spin rounded-full border-2 border-blush-300 border-t-ink"
                      aria-hidden="true"
                    />
                    <p className="font-medium" role="status">
                      Finding your face…
                    </p>
                  </>
                ) : (
                  <>
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-blush-100">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                      >
                        <path d="M4 8a2 2 0 0 1 2-2h1.5l1.4-2h6.2l1.4 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
                        <circle cx="12" cy="12.5" r="3.5" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-display text-2xl">Upload a photo of yourself</p>
                      <p className="mt-1 text-sm text-ink-muted">Drag it here, or choose one below</p>
                    </div>
                    {stage.name === "error" && (
                      <p role="alert" className="max-w-sm rounded-xl bg-blush-100 px-4 py-3 text-sm text-blush-700">
                        {stage.message}
                      </p>
                    )}
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        disabled={!consent}
                        onClick={() => openPicker(fileRef.current)}
                        className="h-12 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-blush-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Choose photo
                      </button>
                      <button
                        type="button"
                        disabled={!consent}
                        onClick={() => openPicker(cameraRef.current)}
                        className="h-12 rounded-full border border-ink px-6 text-sm font-semibold transition hover:bg-blush-100 disabled:cursor-not-allowed disabled:opacity-40 sm:hidden"
                      >
                        Take a selfie
                      </button>
                    </div>
                    {!consent && <p className="text-xs text-ink-muted">Please agree to the photo terms first.</p>}
                  </>
                )}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            {stage.name !== "ready" ? (
              <>
                <ol className="space-y-4">
                  {[
                    ["Face the camera", "A straight-on photo with your whole face visible works best."],
                    ["Pull your hair back", "Tie it back or wear a cap so the wig sits naturally."],
                    ["Good, even light", "Daylight from a window gives the most realistic result."],
                  ].map(([title, text], i) => (
                    <li key={title} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush-400 text-sm font-semibold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="mt-1 text-sm text-ink-soft">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <label className="flex cursor-pointer gap-3 rounded-2xl bg-white p-5 text-sm ring-1 ring-ink/5">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
                  />
                  <span className="text-ink-soft">
                    I agree to my photo being used to create this try-on preview. It isn&apos;t stored.{" "}
                    <Link href="/privacy" className="text-ink underline">
                      How we handle photos
                    </Link>
                  </span>
                </label>
              </>
            ) : (
              <>
                {view === "instant" && (
                  <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Adjust the fit</p>
                      <button
                        type="button"
                        onClick={() => setAdj(NO_ADJUSTMENTS)}
                        className="text-sm text-ink-muted underline hover:text-ink"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="mt-5 space-y-5">
                      {SLIDERS.map((s) => (
                        <label key={s.key} className="block">
                          <span className="text-sm text-ink-soft">{s.label}</span>
                          <input
                            type="range"
                            min={s.min}
                            max={s.max}
                            step={s.step}
                            value={adj[s.key]}
                            onChange={(e) => setAdj((a) => ({ ...a, [s.key]: Number(e.target.value) }))}
                            className="mt-2 block w-full accent-ink"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-ink p-6 text-white">
                  <p className="font-display text-2xl">Want it to look real?</p>
                  <p className="mt-2 text-sm text-white/70">
                    Our AI blends the wig into your photo with a natural hairline, matching light and shadows. It takes
                    about 10–20 seconds.
                  </p>
                  <button
                    type="button"
                    onClick={generateAi}
                    disabled={ai.name === "loading"}
                    className="mt-5 h-12 w-full rounded-full bg-blush-400 text-sm font-semibold text-ink transition hover:bg-blush-300 disabled:opacity-60"
                  >
                    {ai.name === "loading"
                      ? "Creating your look…"
                      : ai.name === "done"
                        ? "Generate again"
                        : "Create realistic AI fit"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={download}
                    className="h-12 rounded-full border border-ink text-sm font-semibold hover:bg-white"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStage({ name: "empty" });
                      setAi({ name: "idle" });
                    }}
                    className="h-12 rounded-full border border-ink text-sm font-semibold hover:bg-white"
                  >
                    New photo
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    add({
                      slug: product.slug,
                      color: product.colors[0],
                      capSize: product.capSizes[1] ?? product.capSizes[0],
                    })
                  }
                  className="h-13 rounded-full bg-ink text-sm font-semibold text-white transition hover:bg-blush-600"
                >
                  Love it — add to bag
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AiLoading() {
  const steps = ["Mapping your face…", "Fitting the cap…", "Blending the hairline…", "Matching your lighting…"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % steps.length), 3000);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center gap-5 p-12 text-center" role="status">
      <div className="relative h-20 w-20">
        <span className="absolute inset-0 animate-ping rounded-full bg-blush-300 opacity-60" />
        <span className="absolute inset-3 rounded-full bg-blush-400" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="font-medium"
        >
          {steps[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
