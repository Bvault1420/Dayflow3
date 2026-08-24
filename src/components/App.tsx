"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { AuthScreen } from "./AuthScreen";
import { BottomNav } from "./BottomNav";
import { Feed } from "./Feed";
import { CreateScreen } from "./CreateScreen";
import { ProfileScreen } from "./ProfileScreen";
import { SettingsScreen } from "./SettingsScreen";
import { HeuteScreen } from "./HeuteScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import type { TabId } from "@/lib/types";
import type { Game } from "@/lib/types";
import { kairosSfx } from "@/lib/kairos-sfx";
import { fetchTrendingGames } from "@/lib/supabase/queries";
import { consumeMoment, readBudget } from "@/lib/moment-budget";

function AppShell() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("heute");
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [feedKey, setFeedKey] = useState(0);
  const [focusGameId, setFocusGameId] = useState<string | null>(null);
  const [authBanner, setAuthBanner] = useState<string | null>(null);
  const [shutter, setShutter] = useState(false);
  const [community, setCommunity] = useState<Game[]>([]);
  const [createPrompt, setCreatePrompt] = useState("");

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

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      setAuthBanner(null);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    void fetchTrendingGames(12)
      .then((rows) => {
        if (!cancelled) setCommunity(rows);
      })
      .catch(() => {
        if (!cancelled) setCommunity([]);
      });
    return () => {
      cancelled = true;
    };
  }, [feedKey]);

  function flashThen(next: () => void) {
    setShutter(true);
    kairosSfx.shutter();
    window.setTimeout(() => {
      next();
      window.setTimeout(() => setShutter(false), 70);
    }, 80);
  }

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
          <div className="fixed inset-x-0 top-0 z-50 bg-hot px-4 py-2 text-center text-sm text-ink">
            {authBanner}
          </div>
        )}
        <AuthScreen />
        <button
          type="button"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line)] bg-surface/90 px-4 py-2 text-sm font-medium text-ink backdrop-blur"
          onClick={() => {
            setShowAuth(false);
            setAuthBanner(null);
          }}
        >
          Weiter ohne Konto
        </button>
      </div>
    );
  }

  function onNavChange(next: TabId) {
    setShowSettings(false);
    setShowAlerts(false);
    if (next === "heute") setFocusGameId(null);
    flashThen(() => setTab(next));
  }

  function openGame(gameId: string) {
    const budget = readBudget();
    if (budget.left <= 0) return;
    consumeMoment();
    setFocusGameId(gameId);
    setFeedKey((k) => k + 1);
    setShowSettings(false);
    flashThen(() => setTab("moments"));
  }

  return (
    <div className="app-shell relative mx-auto min-h-dvh w-full max-w-lg overflow-hidden text-ink sm:my-4 sm:min-h-[min(100dvh-2rem,900px)] sm:rounded-shell">
      <div className="absolute inset-0 overflow-hidden bg-canvas">
        {showSettings ? (
          <SettingsScreen
            onBack={() => {
              setShowSettings(false);
              setTab("profile");
            }}
          />
        ) : showAlerts ? (
          <NotificationsScreen
            onRequireAuth={() => setShowAuth(true)}
            onBack={() => setShowAlerts(false)}
          />
        ) : (
          <>
            {tab === "heute" && (
              <HeuteScreen
                community={community}
                onOpenCreate={(prompt) => {
                  setCreatePrompt(prompt);
                  setCreateKey((k) => k + 1);
                  if (!user) {
                    setShowAuth(true);
                    return;
                  }
                  flashThen(() => setTab("create"));
                }}
                onOpenGame={openGame}
                onOpenMoments={() => {
                  const budget = readBudget();
                  if (budget.left <= 0) return;
                  consumeMoment();
                  setFocusGameId(null);
                  flashThen(() => setTab("moments"));
                }}
              />
            )}
            {tab === "moments" && (
              <Feed
                key={feedKey}
                refreshKey={feedKey}
                focusGameId={focusGameId}
                onNeedAuth={() => setShowAuth(true)}
              />
            )}
            {tab === "profile" && (
              <ProfileScreen
                onRequireAuth={() => setShowAuth(true)}
                onOpenSettings={() => setShowSettings(true)}
                onOpenGame={openGame}
                onOpenAlerts={() => setShowAlerts(true)}
              />
            )}
            {tab === "create" && (
              <CreateScreen
                key={createKey}
                initialPrompt={createPrompt}
                onClose={() => {
                  setCreatePrompt("");
                  flashThen(() => setTab("heute"));
                }}
                onPublished={() => {
                  setCreateKey((k) => k + 1);
                  setFeedKey((k) => k + 1);
                  setFocusGameId(null);
                  setCreatePrompt("");
                  flashThen(() => setTab("profile"));
                }}
              />
            )}
          </>
        )}
      </div>

      {tab !== "create" && !showSettings && !showAlerts && (
        <BottomNav active={tab === "moments" ? "heute" : tab} onChange={onNavChange} />
      )}

      {shutter && <div className="shutter pointer-events-none absolute inset-0 z-[80]" />}
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
