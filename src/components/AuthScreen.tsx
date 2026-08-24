"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { BrandMark, BrandWordmark } from "./Brand";

export function AuthScreen() {
  const { signIn, signUp, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);
    setBusy(true);
    try {
      if (mode === "login") {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          if (/confirm|verif|email_not_confirmed/i.test(res.error)) {
            setNeedsConfirm(true);
            setError("Bitte zuerst die E-Mail bestätigen — oder unten neu senden.");
          } else if (/invalid login/i.test(res.error)) {
            setError("E-Mail oder Passwort stimmt nicht.");
          } else {
            setError(res.error);
          }
        }
      } else {
        if (!displayName.trim()) {
          setError("Bitte einen Namen angeben");
          return;
        }
        const res = await signUp(email.trim(), password, displayName.trim());
        if (res.error) setError(res.error);
        else if (res.needsEmailConfirm) {
          setNeedsConfirm(true);
          setInfo("Konto angelegt. Schau in Posteingang und Spam.");
        } else {
          setInfo("Konto angelegt — du bist drin.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (!email.trim()) {
      setError("Zuerst E-Mail eintragen");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await resendConfirmation(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setInfo("Bestätigung nochmal gesendet.");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-auth-mesh" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-fit">
            <BrandMark className="h-16 w-16 shadow-[0_18px_40px_rgba(232,165,75,0.28)]" />
          </div>
          <BrandWordmark className="block text-5xl text-ink" />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Nicht scrollen. Einen Moment spielen.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--line)] bg-surface/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="mb-5 flex rounded-xl bg-canvas p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                  setNeedsConfirm(false);
                }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                  mode === m ? "bg-ink text-[#140e0a]" : "text-muted"
                }`}
              >
                {m === "login" ? "Login" : "Konto"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit}>
            {mode === "signup" && (
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Name</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-canvas px-4 py-3 text-sm text-ink outline-none ring-accent focus:ring-2"
                  placeholder="dein Name"
                  autoComplete="nickname"
                />
              </label>
            )}

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-medium text-muted">E-Mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-canvas px-4 py-3 text-sm text-ink outline-none ring-accent focus:ring-2"
                placeholder="du@email.de"
                autoComplete="email"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Passwort</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-canvas px-4 py-3 text-sm text-ink outline-none ring-accent focus:ring-2"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {error && (
              <p className="mb-3 rounded-xl bg-hot/15 px-3 py-2 text-sm text-hot">{error}</p>
            )}
            {info && (
              <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">{info}</p>
            )}

            {needsConfirm && (
              <button
                type="button"
                disabled={busy}
                onClick={onResend}
                className="mb-3 w-full rounded-xl border border-[var(--line)] bg-surface py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
              >
                Bestätigung nochmal senden
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-[#140e0a] transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Kairos öffnen" : "Konto anlegen"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            Mit dem Weitergehen giltst du{" "}
            <a href="/terms" className="font-semibold text-accent underline-offset-2 hover:underline">
              Nutzungsbedingungen
            </a>{" "}
            und{" "}
            <a href="/privacy" className="font-semibold text-accent underline-offset-2 hover:underline">
              Datenschutz
            </a>{" "}
            als gelesen.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
