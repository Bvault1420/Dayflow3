/** Public app origin for auth redirects (works on localhost + Cursor preview). */
export function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function getAuthCallbackUrl(next = "/"): string {
  const origin = getAppOrigin();
  const path = next.startsWith("/") ? next : `/${next}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(path)}`;
}
