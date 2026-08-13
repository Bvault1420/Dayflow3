"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { AuthScreen } from "./AuthScreen";
import { BottomNav } from "./BottomNav";
import { Feed } from "./Feed";
import { CreateScreen } from "./CreateScreen";
import { ProfileScreen } from "./ProfileScreen";
import { SettingsScreen } from "./SettingsScreen";
import { ExploreScreen } from "./ExploreScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import type { TabId } from "@/lib/types";

function AppShell() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("feed");
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [feedKey, setFeedKey] = useState(0);
  const [focusGameId, setFocusGameId] = useState<string | null>(null);
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

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      setAuthBanner(null);
    }
  }, [user]);

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
    setShowSettings(false);
    if ((next === "create" || next === "profile" || next === "notifications") && !user) {
      requireAuth(next);
      return;
    }
    if (next === "feed") setFocusGameId(null);
    setTab(next);
  }

  function openGame(gameId: string) {
    setFocusGameId(gameId);
    setFeedKey((k) => k + 1);
    setShowSettings(false);
    setTab("feed");
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
        ) : (
          <>
            {tab === "feed" && (
              <Feed
                key={feedKey}
                refreshKey={feedKey}
                focusGameId={focusGameId}
                onNeedAuth={() => setShowAuth(true)}
              />
            )}
            {tab === "explore" && <ExploreScreen onOpenGame={openGame} />}
            {tab === "notifications" && (
              <NotificationsScreen onRequireAuth={() => setShowAuth(true)} />
            )}
            {tab === "profile" && (
              <ProfileScreen
                onRequireAuth={() => setShowAuth(true)}
                onOpenSettings={() => setShowSettings(true)}
                onOpenGame={openGame}
              />
            )}
            {tab === "create" && (
              <CreateScreen
                key={createKey}
                onClose={() => setTab("feed")}
                onPublished={() => {
                  setCreateKey((k) => k + 1);
                  setFeedKey((k) => k + 1);
                  setFocusGameId(null);
                  setTab("profile");
                }}
              />
            )}
          </>
        )}
      </div>

      {tab !== "create" && !showSettings && <BottomNav active={tab} onChange={onNavChange} />}
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
