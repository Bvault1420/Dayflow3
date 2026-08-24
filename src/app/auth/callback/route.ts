import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function resolveOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  // Cursor / cloud preview proxies to localhost — redirect back to the public host
  if (forwardedHost && !forwardedHost.includes("localhost")) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (
    host &&
    !host.includes("localhost") &&
    !host.startsWith("127.0.0.1") &&
    !host.startsWith("[::1]")
  ) {
    const proto = url.protocol.replace(":", "") || "https";
    return `${proto}://${host}`;
  }

  return url.origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/play";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  const origin = resolveOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/play?authError=${encodeURIComponent(error.message)}`
    );
  }

  // OAuth sometimes returns tokens in hash; or error query
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  if (authError) {
    return NextResponse.redirect(
      `${origin}/play?authError=${encodeURIComponent(authError)}`
    );
  }

  return NextResponse.redirect(`${origin}/play?authError=missing_code`);
}
