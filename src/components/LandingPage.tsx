"use client";

import Link from "next/link";
import { BrandMark, BrandWordmark } from "./Brand";
import { PlayableGame } from "./PlayableGame";
import { dailyMoment, formatTodayLabel } from "@/lib/daily";

export function LandingPage() {
  const daily = dailyMoment();

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <BrandWordmark className="text-2xl" />
        </div>
        <Link
          href="/play"
          className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-[#140e0a]"
        >
          Spielen
        </Link>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {formatTodayLabel()}
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] text-balance sm:text-6xl">
            Nicht scrollen.
            <br />
            Einen Moment spielen.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Jeden Tag ein gemeinsames Mini-Spiel. 10 bis 60 Sekunden. Dann ist es vorbei.
            Sieben Momente am Tag — nicht mehr.
          </p>
          <Link
            href="/play"
            className="mt-8 inline-flex rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-[#140e0a]"
          >
            Heutigen Kairos spielen
          </Link>
        </div>

        <div className="film-frame relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-[1.6rem]">
          <PlayableGame config={daily.play} playing={false} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
            <p className="font-display text-2xl">{daily.title}</p>
            <p className="text-sm text-muted">
              {daily.duration}s · {daily.emotion.label}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-20 sm:grid-cols-3">
        {[
          ["Heute", "Alle spielen dieselbe Runde. Morgen ist sie weg."],
          ["Zu zweit", "Ein Handy, zwei Daumen, zwanzig Sekunden."],
          ["Selber machen", "Ein Gefühl, eine Dauer — fertig ist der Moment."],
        ].map(([title, body]) => (
          <article
            key={title}
            className="rounded-[1.4rem] border border-[var(--line)] bg-surface px-5 py-6"
          >
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-[var(--line)] px-5 py-8 text-center text-xs text-muted">
        <p>Kairos · kurze Spiele, die man teilt.</p>
        <p className="mt-2">
          <Link href="/privacy" className="text-accent">
            Datenschutz
          </Link>
          {" · "}
          <Link href="/terms" className="text-accent">
            Nutzungsbedingungen
          </Link>
          {" · "}
          <Link href="/play" className="text-accent">
            App
          </Link>
        </p>
      </footer>
    </main>
  );
}
