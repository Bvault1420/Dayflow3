import Link from "next/link";
import { BrandMark, BrandWordmark } from "@/components/Brand";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-canvas px-5 py-10 text-ink">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-accent">
        ← Back to Kairos
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <BrandMark className="h-10 w-10" />
        <BrandWordmark className="text-2xl" />
      </div>
      <h1 className="font-display text-3xl font-extrabold">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted">
        Beta terms for creators. Have a lawyer review before a public commercial launch.
      </p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/90">
        <p>
          By using Kairos you agree to follow community rules and not upload illegal, harmful, or
          infringing content.
        </p>
        <p>
          <strong className="font-semibold">Copyright & media.</strong> You may only upload images,
          music, and other assets that (a) you created, (b) you have a valid license to use, or (c)
          are clearly free for this use (for example CC0 / public domain). Commercial songs, movie
          or game characters, brand logos, and other people’s photos without permission are not
          allowed.
        </p>
        <p>
          You keep ownership of your original creations. You grant Kairos a worldwide license to
          host, display, and distribute your published games in the product (feed, profile, remix
          previews).
        </p>
        <p>
          We may remove content or suspend accounts that appear to infringe rights or violate these
          rules. Repeated infringement can lead to account termination.
        </p>
        <p>The service is provided as-is during beta.</p>
      </div>
    </main>
  );
}
