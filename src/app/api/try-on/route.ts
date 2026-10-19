import { getProduct } from "@/lib/products";
import { getTryOnProvider, ProviderError } from "@/lib/ai";
import { rateLimit } from "@/lib/rateLimit";

export const maxDuration = 120;

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const LIMIT_PER_HOUR = Number(process.env.TRY_ON_LIMIT_PER_HOUR) || 5;

const error = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ error: message }, { status, headers });

// Generates a realistic try-on image. Photos are only held in memory for the
// duration of the request and are never written to disk or logged.
export async function POST(request: Request) {
  const provider = getTryOnProvider();
  if (!provider) {
    return error("Realistic AI fitting isn't switched on yet. The instant preview still works!", 501);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = rateLimit(`try-on:${ip}`, LIMIT_PER_HOUR, 60 * 60 * 1000);
  if (!limit.ok) {
    return error(
      `You've reached the limit of ${LIMIT_PER_HOUR} AI try-ons per hour. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
      429,
      { "Retry-After": String(limit.retryAfter) },
    );
  }

  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  const product = getProduct(String(form?.get("slug") ?? ""));
  if (!product) return error("Unknown product.", 400);
  if (!(photo instanceof File)) return error("Please upload a photo.", 400);
  if (!TYPES.has(photo.type)) return error("Please upload a JPG, PNG or WebP photo.", 415);
  if (photo.size > MAX_BYTES) return error("That photo is too large (max 8 MB).", 413);

  const refRes = await fetch(new URL(product.aiReference, request.url));
  if (!refRes.ok) {
    console.error("try-on: reference image missing", product.aiReference);
    return error("Something went wrong on our side. Please try again.", 500);
  }

  try {
    const result = await provider.generate({
      photo: { data: new Uint8Array(await photo.arrayBuffer()), mimeType: photo.type },
      reference: {
        data: new Uint8Array(await refRes.arrayBuffer()),
        mimeType: refRes.headers.get("content-type") || "image/jpeg",
      },
      style: product.aiStyle,
    });
    return new Response(result.data, {
      headers: { "Content-Type": result.mimeType, "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error(`try-on (${provider.name}) failed:`, e instanceof Error ? e.message : e);
    if (e instanceof ProviderError) return error(e.userMessage, 502);
    return error("The AI fitting didn't work this time. Please try again.", 502);
  }
}
