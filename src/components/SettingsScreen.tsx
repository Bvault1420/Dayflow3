"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Bell, Eye, Lock, LogOut, Mail, Shield, User } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "./Brand";

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [privateLikes, setPrivateLikes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setUsername(profile?.username ?? "");
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("kairos_settings");
      if (!raw) return;
      const s = JSON.parse(raw) as {
        notifyLikes?: boolean;
        notifyComments?: boolean;
        privateLikes?: boolean;
      };
      if (typeof s.notifyLikes === "boolean") setNotifyLikes(s.notifyLikes);
      if (typeof s.notifyComments === "boolean") setNotifyComments(s.notifyComments);
      if (typeof s.privateLikes === "boolean") setPrivateLikes(s.privateLikes);
    } catch {
      /* ignore */
    }
  }, []);

  async function saveProfile() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const cleanUser =
      username
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 24) || `player_${user.id.slice(0, 6)}`;
    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || cleanUser,
        bio: bio.trim(),
        username: cleanUser,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setBusy(false);
    if (err) {
      setError(err.message.includes("duplicate") ? "Name schon vergeben" : err.message);
      return;
    }
    localStorage.setItem(
      "kairos_settings",
      JSON.stringify({ notifyLikes, notifyComments, privateLikes })
    );
    await refreshProfile();
    setMessage("Gespeichert");
  }

  return (
    <div className="h-full overflow-y-auto bg-canvas pb-28 scrollbar-hide">
      <div className="flex items-center gap-3 px-4 pb-2 pt-12">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-surface text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold text-ink">Einstellungen</h1>
      </div>

      <div className="mx-4 mt-4 space-y-4">
        <section className="rounded-2xl border border-[var(--line)] bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <User className="h-4 w-4 text-accent" />
            Profil
          </div>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-muted">Anzeigename</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-muted">Benutzername</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
              placeholder="Wofür du Momente machst…"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <Bell className="h-4 w-4 text-accent" />
            Hinweise
          </div>
          <ToggleRow
            label="Likes auf meinen Momenten"
            icon={<Eye className="h-4 w-4" />}
            value={notifyLikes}
            onChange={setNotifyLikes}
          />
          <ToggleRow
            label="Kommentare auf meinen Momenten"
            icon={<Mail className="h-4 w-4" />}
            value={notifyComments}
            onChange={setNotifyComments}
          />
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <Shield className="h-4 w-4 text-accent" />
            Privatsphäre
          </div>
          <ToggleRow
            label="Gelikte Momente privat halten"
            icon={<Lock className="h-4 w-4" />}
            value={privateLikes}
            onChange={setPrivateLikes}
          />
          <a href="/privacy" className="mt-2 block text-sm font-semibold text-accent">
            Datenschutz →
          </a>
          <a href="/terms" className="mt-1 block text-sm font-semibold text-accent">
            Nutzungsbedingungen →
          </a>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-surface p-4">
          <div className="mb-2 flex items-center gap-3">
            <BrandMark className="h-9 w-9" />
            <div>
              <p className="text-sm font-bold text-ink">Account</p>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
          </div>
        </section>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {message && (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">{message}</p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={saveProfile}
          className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-[#140e0a] disabled:opacity-60"
        >
          {busy ? "Speichert…" : "Speichern"}
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              await signOut();
              onBack();
            } catch {
              window.location.assign("/auth/signout");
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-surface py-3 text-sm font-semibold text-ink"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="mb-2 flex w-full items-center justify-between rounded-xl bg-canvas px-3 py-3 text-left"
    >
      <span className="flex items-center gap-2 text-sm text-ink">
        <span className="text-muted">{icon}</span>
        {label}
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-accent" : "bg-surface-2 border border-[var(--line)]"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
