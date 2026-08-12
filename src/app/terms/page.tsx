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
      <p className="mt-2 text-sm text-muted">Placeholder — replace with your lawyer-reviewed terms before public launch.</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/90">
        <p>By using Kairos you agree to follow community rules and not upload illegal or harmful content.</p>
        <p>You keep rights to your creations; you grant Kairos a license to host and display them in the feed.</p>
        <p>Accounts may be suspended for abuse. The service is provided as-is during beta.</p>
      </div>
    </main>
  );
}
