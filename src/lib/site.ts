// Placeholder brand details — replace with the real name, contacts and currency.
export const site = {
  name: "Tressa",
  tagline: "Luxury wigs, tried on before you buy.",
  email: "hello@tressa.example",
  currency: "USD",
  locale: "en-US",
  socials: {
    instagram: "#",
    tiktok: "#",
    facebook: "#",
  },
} as const;

export function formatPrice(amount: number) {
  return new Intl.NumberFormat(site.locale, {
    style: "currency",
    currency: site.currency,
  }).format(amount);
}
