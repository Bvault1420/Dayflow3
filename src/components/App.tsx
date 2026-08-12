"use client";

import { useEffect, useState } from "react";
import { Compass, Bell } from "lucide-react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { AuthScreen } from "./AuthScreen";
import { BottomNav } from "./BottomNav";
import { Feed } from "./Feed";
import { CreateScreen } from "./CreateScreen";
import { ProfileScreen } from "./ProfileScreen";
import type { TabId } from "@/lib/types";

function Placeholder({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Compass;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-canvas px-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="font-display text-3xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted">{body}</p>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("feed");
  const [showAuth, setShowAuth] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [authBanner, setAuthBanner] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("authError");
    if (err) {
      setAuthBanner(decodeURIComponent(err));
      setShowAuth(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-accent/80" />
      </div>
    );
  }

  if (showAuth && !user) {
    return (
      <div className="min-h-dvh">
        {authBanner && (
          <div className="fixed inset-x-0 top-0 z-50 bg-red-600 px-4 py-2 text-center text-sm text-white">
            {authBanner}
          </div>
        )}
        <AuthScreen />
        <button
          type="button"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line)] bg-white/90 px-4 py-2 text-sm font-medium text-ink backdrop-blur"
          onClick={() => {
            setShowAuth(false);
            setAuthBanner(null);
          }}
        >
          Continue browsing
        </button>
      </div>
    );
  }

  function requireAuth(next?: TabId) {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (next) setTab(next);
  }

  function onNavChange(next: TabId) {
    if ((next === "create" || next === "profile" || next === "notifications") && !user) {
      requireAuth(next);
      return;
    }
    setTab(next);
  }

  return (
    <div className="app-shell relative mx-auto min-h-dvh w-full max-w-lg overflow-hidden text-ink sm:my-4 sm:min-h-[min(100dvh-2rem,900px)] sm:rounded-shell">
      <div className="absolute inset-0 overflow-hidden">
        {tab === "feed" && <Feed onNeedAuth={() => setShowAuth(true)} />}
        {tab === "explore" && (
          <Placeholder
            icon={Compass}
            title="Discover"
            body="Trending remixes and rising creators land here next."
          />
        )}
        {tab === "notifications" && (
          <Placeholder
            icon={Bell}
            title="Alerts"
            body="Likes, comments, and follows will show up here."
          />
        )}
        {tab === "profile" && <ProfileScreen onOpenAuth={() => setShowAuth(true)} />}
        {tab === "create" && (
          <CreateScreen
            key={createKey}
            onClose={() => setTab("feed")}
            onPublished={() => {
              setCreateKey((k) => k + 1);
              setTab("profile");
            }}
          />
        )}
      </div>

      {tab !== "create" && <BottomNav active={tab} onChange={onNavChange} />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
