import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
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
  const flowId = searchParams.get("sb_flow_id");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const authError = searchParams.get("error_description") || searchParams.get("error");
  const rawNext = searchParams.get("next") || searchParams.get("redirectTo") || "/";

  // Validate internal redirect
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
      ? rawNext
      : "/";
  let exchangeError: string | null = null;

  if (tokenHash && otpType) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (!error) {
      const redirectOrigin = getConfiguredAppOrigin() || origin;
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
    exchangeError = error.message;
  } else if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (!error) {
      const redirectOrigin = getConfiguredAppOrigin() || origin;
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
    exchangeError = error.message;
  }

  // Redirect to login with error message if exchange fails
  const errorMessage =
    authError || exchangeError || "Invalid or expired authentication link";
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(errorMessage)}`,
  );
}
