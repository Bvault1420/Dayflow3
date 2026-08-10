"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ghost, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

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
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          if (/confirm|verif/i.test(res.error)) {
            setError(
              "E-Mail noch nicht bestätigt. Bestätigungslink in der Mail öffnen — oder in Supabase „Confirm email“ für Tests ausschalten."
            );
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
          setInfo(
            "Account erstellt. Öffne den Bestätigungslink in der E-Mail (funktioniert jetzt mit dieser App-Adresse, nicht nur localhost)."
          );
        } else {
          setInfo("Account erstellt — du bist eingeloggt.");
        }
      }
    } finally {
      setBusy(false);
    }
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
          "Google Login ist in Supabase noch nicht aktiviert. Authentication → Providers → Google einschalten."
        );
      } else {
        setError(res.error);
      }
    }
    // On success the browser redirects away
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-auth-mesh" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-aippy-green text-black shadow-[0_0_40px_rgba(0,255,102,0.35)]">
            <Ghost className="h-8 w-8" strokeWidth={2.2} />
          </div>
          <h1 className="font-display text-4xl tracking-tight text-white">Aippy</h1>
          <p className="mt-2 text-sm text-white/55">
            Scroll short games. Remix with AI. Publish in seconds.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <div className="mb-5 flex rounded-2xl bg-black/40 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
                  mode === m ? "bg-white text-black" : "text-white/50"
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
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white py-3.5 text-sm font-bold text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-5 w-5" />
            )}
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-wide text-white/35">
            <span className="h-px flex-1 bg-white/10" />
            or email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onSubmit}>
            {mode === "signup" && (
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs text-white/45">Display name</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-aippy-green focus:ring-2"
                  placeholder="404angelnotfound"
                  autoComplete="nickname"
                />
              </label>
            )}

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs text-white/45">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-aippy-green focus:ring-2"
                placeholder="you@email.com"
                autoComplete="email"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs text-white/45">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-aippy-green focus:ring-2"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {error && (
              <p className="mb-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
            )}
            {info && (
              <p className="mb-3 rounded-xl bg-aippy-green/15 px-3 py-2 text-sm text-aippy-green">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-aippy-green py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Enter Aippy" : "Create account"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
