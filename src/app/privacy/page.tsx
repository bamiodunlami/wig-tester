import { site } from "@/lib/site";

export const metadata = { title: "Photo privacy" };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.25em] text-blush-600 uppercase">Virtual try-on</p>
      <h1 className="mt-3 font-display text-5xl">How we handle your photo</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-ink-soft">
        <p>
          <strong className="text-ink">The instant preview never leaves your device.</strong> Face detection and wig
          placement run inside your browser. Nothing is uploaded.
        </p>
        <p>
          <strong className="text-ink">The realistic AI fit is only created when you ask for it.</strong> Your photo is
          reduced in size and sent securely to our AI image provider to generate the result. We don&apos;t save your
          photo or the result on our servers.
        </p>
        <p>
          <strong className="text-ink">You stay in control.</strong> Close or refresh the page and the photo is gone.
          The result is only saved if you download it yourself.
        </p>
        <p>
          You must be 18 or older, or have a parent&apos;s permission, to use virtual try-on. Questions? Email{" "}
          <a className="text-ink underline" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
