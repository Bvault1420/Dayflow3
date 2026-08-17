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
            setError("Please confirm your email first, or resend the confirmation mail below.");
          } else if (/invalid login/i.test(res.error)) {
            setError("Email or password is incorrect.");
          } else {
            setError(res.error);
          }
        }
      } else {
        if (!displayName.trim()) {
          setError("Please enter a display name");
          return;
        }
        const res = await signUp(email.trim(), password, displayName.trim());
        if (res.error) setError(res.error);
        else if (res.needsEmailConfirm) {
          setNeedsConfirm(true);
          setInfo("Account created. Check your inbox (and spam) for the confirmation link.");
        } else {
          setInfo("Account created — you're in.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await resendConfirmation(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setInfo("Confirmation email sent again. Check spam too.");
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
            Short playable moments.
            <br />
            Create, remix, and publish in seconds.
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
                Resend confirmation email
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
