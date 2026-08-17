"use client";

import { useEffect, useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { fetchActivityForUser, type ActivityItem } from "@/lib/supabase/queries";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const iconFor = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
} as const;

export function NotificationsScreen({ onRequireAuth }: { onRequireAuth: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchActivityForUser(user.id).then((rows) => {
      if (cancelled) return;
      setItems(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <Bell className="h-10 w-10 text-accent" />
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">Alerts</h2>
        <p className="mt-2 text-sm text-muted">Sign in to see likes, comments, and new followers.</p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-canvas px-4 pb-28 pt-12 scrollbar-hide">
      <h1 className="font-display text-3xl font-extrabold text-ink">Alerts</h1>
      <p className="mt-1 text-sm text-muted">Likes, comments, and follows on your games</p>

      {loading ? (
        <p className="mt-16 text-center text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          No activity yet. Publish a game and interactions will show up here.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((item) => {
            const Icon = iconFor[item.kind];
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white px-3 py-3"
              >
                <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-semibold">{item.actor_name}</span> {item.body}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">{timeAgo(item.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
