"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-urls";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: string | null; needsEmailConfirm?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (userId: string, meta?: { display_name?: string }) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.warn("Profile load:", error.message);
          setProfile(null);
          return;
        }

        if (data) {
          setProfile(data as Profile);
          return;
        }

        // Trigger may have missed (e.g. confirm-email delay) — create profile now
        const base =
          (meta?.display_name || "player")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") || "player";
        const username = `${base}_${userId.replace(/-/g, "").slice(0, 6)}`;
        const { data: created, error: upsertErr } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              username,
              display_name: meta?.display_name || base,
            },
            { onConflict: "id" }
          )
          .select("*")
          .maybeSingle();

        if (upsertErr) {
          console.warn("Profile ensure:", upsertErr.message);
          setProfile(null);
          return;
        }
        setProfile((created as Profile) ?? null);
      } catch (err) {
        console.warn("Profile load failed:", err);
        setProfile(null);
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.id);
  }, [loadProfile, user]);

  useEffect(() => {
    let mounted = true;

    const timeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

    const finish = () => {
      if (mounted) setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await loadProfile(data.session.user.id, {
            display_name: data.session.user.user_metadata?.display_name,
          });
        }
      })
      .catch((err) => {
        console.warn("getSession failed:", err);
      })
      .finally(finish);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id, {
          display_name: nextSession.user.user_metadata?.display_name,
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const emailRedirectTo = getAuthCallbackUrl("/");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { display_name: displayName },
        },
      });
      if (error) return { error: error.message };

      // Session present => email confirm is off or already confirmed
      const needsEmailConfirm = !data.session;

      if (data.user && data.session) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            username:
              displayName.toLowerCase().replace(/[^a-z0-9]/g, "") +
              "_" +
              data.user.id.slice(0, 6),
            display_name: displayName,
          },
          { onConflict: "id" }
        );
      }
      return { error: null, needsEmailConfirm };
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl("/"),
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    return { error: error?.message ?? null };
  }, [supabase]);

  const resendConfirmation = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: getAuthCallbackUrl("/") },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      refreshProfile,
      signIn,
      signUp,
      signInWithGoogle,
      resendConfirmation,
      signOut,
    }),
    [
      user,
      session,
      profile,
      loading,
      refreshProfile,
      signIn,
      signUp,
      signInWithGoogle,
      resendConfirmation,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
