"use client";

import { Bell, Compass, Ghost, Plus, User } from "lucide-react";
import type { TabId } from "@/lib/types";

const ITEMS: { id: TabId; icon: typeof Ghost; label: string }[] = [
  { id: "feed", icon: Ghost, label: "Home" },
  { id: "explore", icon: Compass, label: "Explore" },
  { id: "notifications", icon: Bell, label: "Alerts" },
  { id: "profile", icon: User, label: "Profile" },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2">
        <div className="flex flex-1 items-center justify-around rounded-[1.75rem] border border-white/10 bg-[#121214]/95 px-2 py-2.5 shadow-2xl backdrop-blur-xl">
          {ITEMS.map(({ id, icon: Icon, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                onClick={() => onChange(id)}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                  isActive ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Create"
          onClick={() => onChange("create")}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-aippy-green text-black shadow-[0_0_28px_rgba(0,255,102,0.45)] transition hover:scale-105 active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.8} />
        </button>
      </div>
    </nav>
  );
}
