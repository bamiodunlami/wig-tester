# Wig Tester — Build Plan

An e-commerce site for wigs with an animated hero and a per-product **virtual try-on**: the customer uploads a photo and sees the wig fitted on their own head before buying.

---

## 1. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Pages + API routes in one project; the AI try-on calls need a server so API keys stay secret |
| Styling | **Tailwind CSS** | Fast to build responsive layouts like the 3×2 grid |
| Animation | **Framer Motion** | Smooth spring-based mouse tracking for the hero |
| Face detection (in-browser) | **MediaPipe Face Landmarker** | Finds the head in the uploaded photo, for the instant preview and for auto-cropping |
| AI try-on (server) | Image-editing model behind `/api/try-on` (candidates to compare: Gemini image editing, FLUX Kontext, a Replicate hair-swap model) | Realistic blending of hairline, lighting and skin tone |
| Cart state | **Zustand**, saved to `localStorage` | Small and simple |
| Checkout | **Stripe Checkout** | Hosted payment page, so we don't handle card data |
| Hosting | **Vercel** | Built for Next.js; image optimization included |

Product data starts as a local `products.ts` file. It can move to a CMS or Shopify later without changing the UI.

---

## 2. Site structure

```
/                       Home: Hero → Featured Wigs (3×2) → Footer
/products/[slug]        Product page: gallery, details, Try-On panel, Add to cart
/cart                   Cart → Stripe Checkout
/checkout/success       Order confirmation
/api/try-on             POST photo + productId → fitted image
/api/checkout           Creates the Stripe Checkout session
```

```
src/
  app/            (routes above)
  components/
    layout/       Header, Footer
    home/         Hero, HeroDoll, ProductGrid, ProductCard
    product/      Gallery, ProductInfo, TryOn/ (Uploader, OverlayPreview, AiResult)
    cart/         CartDrawer, CartItem
  lib/            products.ts, faceLandmarks.ts, tryOnClient.ts, stripe.ts
  store/          cart.ts
public/
  hero/           doll angle frames (frame-00.webp … frame-NN.webp)
  wigs/<slug>/    catalog photos + transparent overlay PNG
```

---

## 3. Hero section

**Layout:** two columns on desktop, stacked on mobile.
- **Left:** title, short description and a **Shop Now** button that scrolls to the product grid. The text fades and slides in on load.
- **Right:** the doll wearing the wig, which reacts to the mouse.

**How "the wig sides show as the mouse moves" works:**

A single flat photo can't show the side of a wig. We need **several photos of the doll taken from different angles**, and the hero swaps between them as the mouse moves.

1. **Angle frames:** 7–9 images of the same doll and wig, from the left profile through the front to the right profile, all with the same framing and background. These can be:
   - shot on a turntable (best quality), or
   - generated with AI from the single hero image you provide (new views of the same subject), then touched up so they match.
2. **Mouse → frame:** read the cursor's horizontal position in the hero, from −1 (far left) to +1 (far right), smooth it with a spring, and pick the matching frame. Cross-fading between neighbouring frames keeps it from flickering.
3. **Depth on top:** a slight 3D tilt (`rotateX/rotateY`, ±6°) following the cursor's vertical position, a soft parallax shadow, and a subtle highlight that moves across the hair.
4. **Fallbacks:**
   - Touch devices: use the phone's tilt sensor where allowed, otherwise turn slowly on its own.
   - `prefers-reduced-motion`: show the front frame only.
   - Preload all frames, using small WebP files of about 60–120 KB each.

> **Upgrade path:** with a 3D model (GLB) of the doll and wig, a `react-three-fiber` scene could rotate it freely. This costs more to make, so it isn't planned for v1.

---

## 4. Featured wigs (3 columns × 2 rows)

- A responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile, with 6 products.
- **Card:** main image, a second image (side or back view) that fades in on hover, name, length/texture tags, price and a "Try it on" badge.
- Cards appear one after another as you scroll to them, and lift slightly on hover.
- Clicking a card opens `/products/[slug]`.

**Product data model:**
```ts
type Wig = {
  slug: string; name: string; price: number;
  description: string;
  length: string; texture: string; color: string; capSize: string[];
  images: string[];          // catalog photos
  overlayPng: string;        // transparent front-facing wig, for the instant preview
  overlayAnchors: {          // where the hairline/temples sit on the PNG
    leftTemple: [x, y]; rightTemple: [x, y]; hairlineCenter: [x, y];
  };
  tryOnPrompt: string;       // style description given to the AI model
};
```

---

## 5. Product page and virtual try-on

**Layout:** image gallery on the left. On the right: name, price, cap size and colour options, **Add to cart**, and the **Try It On** panel. Details, care instructions and shipping go in tabs below.

### Try-on flow
1. **Upload or take a photo:** drag and drop, file picker, or the camera on mobile. Shows tips such as "face the camera, hair pulled back, good lighting".
2. **Check the photo in the browser:** MediaPipe finds the face.
   - No face, or several faces → show a friendly error.
   - Crop around the head and shrink to about 1024 px before uploading, which is faster and cheaper.
3. **Instant preview, in about 1 second, free, never leaves the device:**
   - Use the face landmarks (temples, forehead, head tilt) to scale, rotate and place the wig's transparent PNG over the head.
   - Sliders let the customer nudge size and position by hand.
4. **"Generate realistic fit", using AI, in about 5–20 seconds:**
   - `POST /api/try-on` with the cropped photo, product id and selected colour.
   - The server sends the model the photo, the product's reference image(s) and a fixed instruction: *"Replace the person's hair with this wig. Keep face, skin tone, expression, and background unchanged. Natural hairline, matching lighting."*
   - Shows a loading animation, then a **before/after slider**, with Download and **Add to cart** buttons.
5. **Optional:** try several wigs on the same photo without uploading again. The photo is kept in memory for the session only.

### Server details for `/api/try-on`
- Check file type and size (≤ 8 MB, JPEG/PNG/WebP/HEIC).
- Limit requests per IP or session, for example 5 AI generations per hour, to control cost.
- The model provider sits behind a small adapter interface, so models can be swapped or A/B tested.
- **No photo is stored:** photos are processed in memory and discarded, and results are sent back directly or via a signed URL that expires in 1 hour.
- Timeouts and retries. If the AI fails, the customer still has the instant preview.

### Privacy and trust
- A consent checkbox before upload, linked to the privacy policy.
- A clear notice: "Your photo is only used to generate this preview and is deleted immediately."
- Minors: the terms of service set an age requirement.

---

## 6. Cart and checkout
- A cart drawer with quantity, cap size and colour for each item.
- `/api/checkout` creates a Stripe Checkout session, then shows `/checkout/success`.
- Stripe webhooks for orders can come later, when an admin or order system exists.

---

## 7. Footer
- Brand logo and tagline, plus newsletter sign-up.
- Link columns: Shop (All wigs, New, Best sellers), Help (Shipping, Returns, Wig care, Sizing guide, FAQ), Company (About, Contact).
- Social icons, payment method icons, © line, and links to the privacy policy and terms.

---

## 8. Design system
- Color tokens, a display serif for headings with a clean sans-serif for body text, and spacing and corner-radius scales, all in Tailwind config.
- Accessibility: keyboard focus on all controls, alt text, AA colour contrast, and reduced-motion support.
- Performance targets: hero LCP < 2.5 s, image optimization through `next/image`, and MediaPipe and the try-on code loaded only on product pages.

---

## 9. Build phases

| Phase | Deliverable |
|---|---|
| **0. Setup** | Next.js + Tailwind + lint/format, deploy to a Vercel preview |
| **1. Static site** | Header, hero (static image), 3×2 grid with placeholder data, product page layout, footer |
| **2. Hero animation** | Angle frames prepared, mouse-to-frame mapping, tilt and parallax, mobile and reduced-motion fallbacks |
| **3. Instant try-on** | Upload, MediaPipe face detection, PNG overlay fitting, adjustment sliders |
| **4. AI try-on** | `/api/try-on` with provider adapter, rate limiting, before/after UI; compare 2–3 models on test photos and pick one |
| **5. Commerce** | Cart store and drawer, Stripe Checkout, success page |
| **6. Polish** | Animations, SEO metadata, accessibility checks, Lighthouse, privacy page, analytics |

---

## 10. What I need from you
1. **Hero image**, and ideally **7–9 angle shots** of the doll from left profile to right profile. Otherwise I'll generate the angles from your single image.
2. **6 wigs:** names, prices, descriptions, colours/sizes, and 2–4 photos each. A front-facing photo on a plain background is best for the overlay PNG.
3. **Brand:** name, logo, colours and fonts, if you have them.
4. **Accounts/keys:** Stripe, and the AI image provider, which I can help choose in Phase 4.
5. **Decisions:**
   - Stripe-only checkout, or headless Shopify for inventory and orders?
   - A budget per AI try-on, which sets the rate limits and which model to use.
