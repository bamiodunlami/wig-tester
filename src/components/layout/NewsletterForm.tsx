"use client";

import { useState } from "react";

// Not wired to an email provider yet — it only confirms locally.
export function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="mt-6 text-sm text-blush-300">Thanks! You&apos;re on the list.</p>;
  }

  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Your email"
        className="h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 text-sm placeholder:text-white/40 focus:border-blush-400 focus:outline-none"
      />
      <button
        type="submit"
        className="h-11 rounded-full bg-blush-400 px-5 text-sm font-semibold text-ink transition hover:bg-blush-300"
      >
        Join
      </button>
    </form>
  );
}
