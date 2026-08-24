"use client";

import { Plus, Sun, User } from "lucide-react";
import type { TabId } from "@/lib/types";

const ITEMS: { id: TabId; icon: typeof Sun; label: string }[] = [
  { id: "heute", icon: Sun, label: "Heute" },
  { id: "profile", icon: User, label: "Ich" },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-stretch gap-2">
        <div className="flex flex-1 items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)]/90 px-1.5 py-1.5 backdrop-blur-xl">
          {ITEMS.map(({ id, icon: Icon, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                onClick={() => onChange(id)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition ${
                  isActive ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={isActive ? 2.5 : 2} />
                <span className="truncate text-[10px] font-semibold tracking-wide">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Moment machen"
          onClick={() => onChange("create")}
          className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-hot text-hot-ink transition hover:brightness-105 active:scale-[0.97]"
        >
          <Plus className="h-6 w-6" strokeWidth={2.6} />
        </button>
      </div>
    </nav>
  );
}
