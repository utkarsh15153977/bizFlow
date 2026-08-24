import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getConfiguredAppOrigin(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return null;

  try {
    const url = new URL(appUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") || searchParams.get("redirectTo") || "/";

  // Validate internal redirect
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
      ? rawNext
      : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectOrigin = getConfiguredAppOrigin() || origin;
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  // Redirect to login with error message if exchange fails
  return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+authentication+link`);
}
