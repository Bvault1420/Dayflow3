import Link from "next/link";
import { BrandMark, BrandWordmark } from "@/components/Brand";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-canvas px-5 py-10 text-ink">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-accent">
        ← Back to Kairos
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <BrandMark className="h-10 w-10" />
        <BrandWordmark className="text-2xl" />
      </div>
      <h1 className="font-display text-3xl font-extrabold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Placeholder — replace with your lawyer-reviewed text before public launch.</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/90">
        <p>
          Kairos stores account and gameplay data in your Supabase project (hosted database).
          Passwords are hashed by Supabase Auth. Data in transit uses HTTPS.
        </p>
        <p>
          Typical data: email, profile fields, created games, likes, saves, comments, and view events.
        </p>
        <p>
          Controllers should list contact details, retention periods, and the processor (Supabase) for GDPR compliance.
        </p>
      </div>
    </main>
  );
}
