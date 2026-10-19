import { getProduct } from "@/lib/products";
import { site } from "@/lib/site";

type Line = { slug: string; color: string; capSize: string; quantity: number };

// Creates a Stripe Checkout session. Prices always come from the catalog, never the client.
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return Response.json(
      { error: "Checkout isn't connected yet — add STRIPE_SECRET_KEY to enable payments." },
      { status: 501 },
    );
  }

  const body = (await request.json().catch(() => null)) as { items?: Line[] } | null;
  const items = Array.isArray(body?.items) ? body.items.slice(0, 20) : [];
  const form = new URLSearchParams();
  let count = 0;

  for (const item of items) {
    const product = getProduct(String(item.slug));
    if (!product) continue;
    const color = product.colors.includes(item.color) ? item.color : product.colors[0];
    const capSize = product.capSizes.includes(item.capSize) ? item.capSize : product.capSizes[0];
    const quantity = Math.max(1, Math.min(10, Math.floor(Number(item.quantity)) || 1));
    const p = `line_items[${count}]`;
    form.set(`${p}[quantity]`, String(quantity));
    form.set(`${p}[price_data][currency]`, site.currency.toLowerCase());
    form.set(`${p}[price_data][unit_amount]`, String(Math.round(product.price * 100)));
    form.set(`${p}[price_data][product_data][name]`, `${product.name} ${product.length}`);
    form.set(`${p}[price_data][product_data][description]`, `${color} · ${capSize}`);
    count++;
  }

  if (count === 0) {
    return Response.json({ error: "Your bag is empty." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  form.set("mode", "payment");
  form.set("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/`);
  form.set("shipping_address_collection[allowed_countries][0]", "US");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const session = await res.json();
  if (!res.ok) {
    console.error("Stripe checkout error", session?.error?.message);
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
  return Response.json({ url: session.url });
}
