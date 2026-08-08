"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ghost, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
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
        if (res.error) setError(res.error);
      } else {
        if (!displayName.trim()) {
          setError("Pick a display name");
          return;
        }
        const res = await signUp(email.trim(), password, displayName.trim());
        if (res.error) setError(res.error);
        else setInfo("Account created. Check your email if confirmation is required, then sign in.");
      }
    } finally {
      setBusy(false);
    }
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

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
        >
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
      </motion.div>
    </div>
  );
}
