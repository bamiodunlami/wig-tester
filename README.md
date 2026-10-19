# Wig Tester

An e-commerce site for wigs with an animated hero and a virtual try-on on every product page. See [PLAN.md](PLAN.md) for the full plan.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add API keys
npm run dev                  # http://localhost:3000
```

## What's built

| Area | Where |
| --- | --- |
| Hero: the model turns to follow the cursor (5 angles), and moving the cursor up shows the parting | `src/components/home/HeroModel.tsx` |
| 3×2 product grid | `src/components/home/ProductGrid.tsx`, `ProductCard.tsx` |
| Product page: gallery, options, add to bag | `src/app/products/[slug]/page.tsx`, `src/components/product/` |
| **Instant try-on**: finds the face in the browser (MediaPipe) and fits the wig cut-out to it, with sliders to adjust | `src/components/product/TryOn.tsx`, `src/lib/tryon.ts` |
| **Realistic AI try-on**: server route that sends the photo and the wig reference to an image-editing model | `src/app/api/try-on/route.ts`, `src/lib/ai/` |
| Bag (saved in the browser) and Stripe Checkout | `src/components/cart/CartDrawer.tsx`, `src/app/api/checkout/route.ts` |
| Footer, photo privacy page | `src/components/layout/Footer.tsx`, `src/app/privacy/page.tsx` |

## Configuration

| Variable | Needed for |
| --- | --- |
| `GEMINI_API_KEY` | Realistic AI try-on. Without it, the instant preview still works. |
| `GEMINI_IMAGE_MODEL` | Optional. Overrides the model (default `gemini-2.5-flash-image`). |
| `TRY_ON_LIMIT_PER_HOUR` | Optional. AI try-ons per visitor per hour (default 5). |
| `STRIPE_SECRET_KEY` | Checkout. Without it, the bag shows a "not connected" message. |

To use a different AI provider, implement `TryOnProvider` in `src/lib/ai/` and return it from `getTryOnProvider()`.

## Placeholders to replace

- **Brand name, logo, contact email, currency**: `src/lib/site.ts` and `src/components/layout/Logo.tsx`.
- **Products**: `src/lib/products.ts`. All 6 products reuse the hero photos for now.
- **Shipping and returns wording** (free shipping over $150, 30-day returns): Hero, Footer and the product page.
- **Newsletter**: not connected to an email provider.

## Adding a wig's try-on overlay

The instant try-on needs a transparent cut-out of each wig and the eye positions in the photo. Generate both from a front-facing photo:

```bash
mkdir -p .models
curl -Lo .models/face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
curl -Lo .models/selfie_multiclass_256x256.tflite https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite
node scripts/build-overlay.mjs public/wigs/my-wig-front.jpg public/wigs/my-wig-overlay.png .models
```

Paste the printed anchors into the product's `overlay` field. The script needs a Chromium binary (`CHROMIUM_PATH`, or Playwright's browsers).
