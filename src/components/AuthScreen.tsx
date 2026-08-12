"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { BrandMark, BrandWordmark } from "./Brand";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.7.5-2.4 1.9C5.1 19.4 8.3 21.5 12 21.5c2.7 0 4.9-.9 6.5-2.4l-3.1-2.4c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1z"
      />
      <path
        fill="#4A90E2"
        d="M3.5 7.3C2.7 8.8 2.2 10.4 2.2 12s.5 3.2 1.3 4.7c0 .1 3.1-2.4 3.1-2.4-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.5 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.3 14.7 1.5 12 1.5 8.3 1.5 5.1 3.6 3.5 7.3l3.1 2.4C7.2 7.1 9.4 5.3 12 5.3z"
      />
    </svg>
  );
}

export function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, resendConfirmation } = useAuth();
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
            setError(
              "E-Mail ist noch nicht bestätigt. Schau in Spam — oder tippe unten auf „Mail erneut senden“. Am schnellsten: in Supabase „Confirm email“ ausschalten."
            );
          } else if (/invalid login/i.test(res.error)) {
            setError("E-Mail oder Passwort falsch.");
          } else {
            setError(res.error);
          }
        }
      } else {
        if (!displayName.trim()) {
          setError("Bitte Display-Name eingeben");
          return;
        }
        const res = await signUp(email.trim(), password, displayName.trim());
        if (res.error) setError(res.error);
        else if (res.needsEmailConfirm) {
          setNeedsConfirm(true);
          setInfo(
            "Account erstellt. Bestätigungsmails vom kostenlosen Supabase-Mailer kommen oft nicht an (Spam/Limit). Am besten Confirm email in Supabase ausschalten — dann kannst du direkt einloggen."
          );
        } else {
          setInfo("Account erstellt — du bist eingeloggt.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (!email.trim()) {
      setError("Bitte zuerst E-Mail eintragen");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await resendConfirmation(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setInfo("Bestätigungsmail wurde erneut angefordert. Spam-Ordner prüfen.");
  }

  async function onGoogle() {
    setError(null);
    setInfo(null);
    setBusy(true);
    const res = await signInWithGoogle();
    if (res.error) {
      setBusy(false);
      if (/provider is not enabled/i.test(res.error)) {
        setError(
          "Google ist in Supabase noch aus. Gehe zu Authentication → Providers → Google → Enable und trage Client ID + Secret ein."
        );
      } else {
        setError(res.error);
      }
      return;
    }
    // If OAuth URL opens but provider is broken, user sees Supabase error page.
    // Soft hint after a short delay if still on page:
    window.setTimeout(() => setBusy(false), 4000);
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
            <BrandMark className="h-16 w-16 shadow-[0_18px_40px_rgba(36,87,255,0.28)]" />
          </div>
          <BrandWordmark className="block text-5xl text-ink" />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Short playable moments. Remix with AI.
            <br />
            Publish what people swipe next.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-5 shadow-[0_20px_60px_rgba(14,22,33,0.08)] backdrop-blur-xl">
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
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition ${
                  mode === m ? "bg-ink text-white" : "text-muted"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onGoogle}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white py-3.5 text-sm font-bold text-ink transition hover:bg-surface-2 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-5 w-5" />
            )}
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/70">
            <span className="h-px flex-1 bg-[var(--line)]" />
            or email
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <form onSubmit={onSubmit}>
            {mode === "signup" && (
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Display name</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-ink outline-none ring-accent focus:ring-2"
                  placeholder="yourname"
                  autoComplete="nickname"
                />
              </label>
            )}

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-ink outline-none ring-accent focus:ring-2"
                placeholder="you@email.com"
                autoComplete="email"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-ink outline-none ring-accent focus:ring-2"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {error && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            {info && (
              <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">{info}</p>
            )}

            {needsConfirm && (
              <button
                type="button"
                disabled={busy}
                onClick={onResend}
                className="mb-3 w-full rounded-xl border border-[var(--line)] bg-white py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
              >
                Bestätigungsmail erneut senden
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Enter Kairos" : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            By continuing you agree to our{" "}
            <a href="/terms" className="font-semibold text-accent underline-offset-2 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="font-semibold text-accent underline-offset-2 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
}
