import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";

/** Firefox drops Secure cookies on http://localhost and http://127.0.0.1. */
export function sessionCookieOptions(
  request: NextRequest,
  options?: CookieOptions
): CookieOptions {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps =
    forwardedProto === "https" || request.nextUrl.protocol === "https:";
  return {
    ...options,
    path: "/",
    sameSite: "lax",
    secure: isHttps,
  };
}
