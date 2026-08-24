"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Tables, UserRole } from "@/types/database.types";
import type { Role } from "@/lib/auth/roles";

export type AuthActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

export type CurrentUserContext = {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Tables<"profiles"> | null;
  organization: Tables<"organizations"> | null;
  membership: Tables<"organization_members"> | null;
  role: Role | null;
};

/**
 * Validates that a redirect path is internal to prevent open redirect vulnerabilities.
 */
function getSafeRedirectUrl(redirectTo?: string | null): string {
  if (!redirectTo) {
    return "/";
  }

  // Must start with '/' but not '//' or contain protocol schemes
  if (
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("://")
  ) {
    return redirectTo;
  }

  return "/";
}

function resolveActionFormData(
  prevStateOrFormData: AuthActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): FormData | AuthActionResult {
  if (formDataOrUndefined instanceof FormData) return formDataOrUndefined;
  if (prevStateOrFormData instanceof FormData) return prevStateOrFormData;

  return { error: "Invalid form submission." };
}

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

async function getTrustedAppOrigin(): Promise<string | null> {
  const configuredOrigin = getConfiguredAppOrigin();

  if (configuredOrigin) return configuredOrigin;

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) return null;

  return `http://${host}`;
}

/**
 * Retrieves the currently authenticated Supabase user.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

/**
 * Retrieves the profile associated with the currently authenticated user.
 */
export async function getCurrentProfile(): Promise<Tables<"profiles"> | null> {
  const user = await getCurrentUser();

  if (!user) return null;

  try {
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile;
  } catch {
    return null;
  }
}

/**
 * Retrieves the active organization membership for the currently authenticated user.
 */
export async function getCurrentMembership(): Promise<
  Tables<"organization_members"> | null
> {
  const user = await getCurrentUser();

  if (!user) return null;

  try {
    const supabase = await createClient();

    const { data: membership } = await supabase
      .from("organization_members")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    return membership;
  } catch {
    return null;
  }
}

/**
 * Retrieves the active organization for the currently authenticated user.
 */
export async function getCurrentOrganization(): Promise<
  Tables<"organizations"> | null
> {
  const membership = await getCurrentMembership();

  if (!membership) return null;

  try {
    const supabase = await createClient();

    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single();

    return org;
  } catch {
    return null;
  }
}

/**
 * Retrieves the role of the currently authenticated user in their active organization.
 */
export async function getCurrentRole(): Promise<Role | null> {
  const membership = await getCurrentMembership();

  return (membership?.role as Role) || null;
}

/**
 * Efficiently aggregates user, profile, organization, and role context for layouts.
 */
export async function getCurrentUserContext(): Promise<CurrentUserContext> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      profile: null,
      organization: null,
      membership: null,
      role: null,
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return {
        user: null,
        profile: null,
        organization: null,
        membership: null,
        role: null,
      };
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Fetch user's active organization membership and joined organization
    const { data: memberRecord } = await supabase
      .from("organization_members")
      .select("*, organizations(*)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const organization =
      memberRecord && memberRecord.organizations
        ? (memberRecord.organizations as unknown as Tables<"organizations">)
        : null;

    const membership: Tables<"organization_members"> | null = memberRecord
      ? {
          id: memberRecord.id,
          organization_id: memberRecord.organization_id,
          user_id: memberRecord.user_id,
          role: memberRecord.role as UserRole,
          created_at: memberRecord.created_at,
          updated_at: memberRecord.updated_at,
        }
      : null;

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      organization,
      membership,
      role: (memberRecord?.role as Role) ?? null,
    };
  } catch {
    return {
      user: null,
      profile: null,
      organization: null,
      membership: null,
      role: null,
    };
  }
}

/**
 * Authenticates a user using email and password.
 */
export async function signInWithPassword(
  _prevState: AuthActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<AuthActionResult> {
  const formData = resolveActionFormData(
    _prevState,
    formDataOrUndefined,
  );

  if (!(formData instanceof FormData)) return formData;

  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const rawRedirectTo = formData.get("redirectTo")?.toString();

  if (!email || !password) {
    return {
      error: "Please enter both email and password.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with your real project credentials.",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (
        error.message === "fetch failed" ||
        error.name === "AuthRetryableFetchError"
      ) {
        return {
          error:
            "Unable to connect to Supabase. Please verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
        };
      }

      return {
        error: error.message || "Invalid login credentials.",
      };
    }

    const destination = getSafeRedirectUrl(rawRedirectTo);

    revalidatePath("/", "layout");

    redirect(destination);
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      throw err;
    }

    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred during login.";

    if (message === "fetch failed") {
      return {
        error:
          "Unable to connect to Supabase Auth. Please check your NEXT_PUBLIC_SUPABASE_URL and API key in .env.local.",
      };
    }

    return {
      error: message,
    };
  }
}

/**
 * Registers a new user and lets the database trigger create the profile and workspace.
 */
export async function signUpWithPassword(
  _prevState: AuthActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<AuthActionResult> {
  const formData = resolveActionFormData(
    _prevState,
    formDataOrUndefined,
  );

  if (!(formData instanceof FormData)) return formData;

  const fullName = formData.get("fullName")?.toString().trim();

  const companyName = (
    formData.get("companyName") ||
    formData.get("organizationName")
  )
    ?.toString()
    .trim();

  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const confirmPassword =
    formData.get("confirmPassword")?.toString();

  if (!fullName) {
    return {
      error: "Full name is required.",
    };
  }

  if (!companyName) {
    return {
      error: "Workspace / company name is required.",
    };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      error: "Please enter a valid email address.",
    };
  }

  if (!password || password.length < 8) {
    return {
      error: "Password must contain at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local with your real project credentials.",
    };
  }

  try {
    const origin = await getTrustedAppOrigin();

    if (!origin) {
      return {
        error: "Application URL is not configured.",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_name: companyName,
          company_name: companyName,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      if (
        error.message === "fetch failed" ||
        error.name === "AuthRetryableFetchError"
      ) {
        return {
          error:
            "Unable to connect to Supabase. Please verify that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local are set to your real project credentials.",
        };
      }

      return {
        error: error.message || "Unable to create account.",
      };
    }

    if (!data.user) {
      return {
        error: "Unable to create account. Please try again.",
      };
    }

    // Check if user already exists
    if (
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      return {
        error:
          "An account with this email address already exists. Please sign in instead.",
      };
    }

    // If session is active
    if (data.session) {
      revalidatePath("/", "layout");
      redirect("/");
    }

    return {
      success: true,
      message:
        "Account created successfully! Please check your email for a confirmation link to activate your workspace.",
    };
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      throw err;
    }

    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred during signup.";

    if (message === "fetch failed") {
      return {
        error:
          "Unable to reach the Supabase Auth server. Please check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local are set correctly.",
      };
    }

    return {
      error: message,
    };
  }
}

/**
 * Signs out the current user and clears session cookies.
 */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Continue to redirect even if sign out call fails
    }
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Requests a password reset link sent to the user's email.
 */
export async function requestPasswordReset(
  _prevState: AuthActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<AuthActionResult> {
  const formData = resolveActionFormData(
    _prevState,
    formDataOrUndefined,
  );

  if (!(formData instanceof FormData)) return formData;

  const email = formData.get("email")?.toString().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      error: "Please enter a valid email address.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    };
  }

  try {
    const origin = await getTrustedAppOrigin();

    if (!origin) {
      return {
        error: "Application URL is not configured.",
      };
    }

    const supabase = await createClient();

    const redirectUrl =
      `${origin}/auth/callback?next=/reset-password`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

    if (error) {
      console.error(
        "========== PASSWORD RESET ERROR ==========",
      );

      console.error("Supabase error:", error);
      console.error("Message:", error.message);
      console.error("Name:", error.name);
      console.error("Status:", error.status);
      console.error("Origin:", origin);
      console.error("Redirect URL:", redirectUrl);

      console.error(
        "==========================================",
      );

      if (
        error.message === "fetch failed" ||
        error.name === "AuthRetryableFetchError"
      ) {
        return {
          error:
            "Unable to reach the Supabase Auth server. Please verify your connection and environment variables.",
        };
      }

      return {
        error:
          error.message ||
          "Unable to send password reset email.",
      };
    }

    return {
      success: true,
      message:
        "Check your email. If the email is registered, you'll receive instructions to reset your password.",
    };
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      throw err;
    }

    console.error(
      "========== PASSWORD RESET EXCEPTION ==========",
    );
    console.error("Error:", err);
    console.error(
      "==============================================",
    );

    return {
      error:
        "Unable to send password reset email. Please check your connection and configuration.",
    };
  }
}

/**
 * Updates the user's password using the active recovery session.
 */
export async function updatePassword(
  _prevState: AuthActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<AuthActionResult> {
  const formData = resolveActionFormData(
    _prevState,
    formDataOrUndefined,
  );

  if (!(formData instanceof FormData)) return formData;

  const password = formData.get("password")?.toString();
  const confirmPassword =
    formData.get("confirmPassword")?.toString();

  if (!password || password.length < 8) {
    return {
      error: "Password must contain at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        error:
          error.message ||
          "Failed to update password.",
      };
    }

    revalidatePath("/", "layout");

    redirect(
      "/login?message=Your+password+has+been+updated+successfully",
    );
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      throw err;
    }

    const message =
      err instanceof Error
        ? err.message
        : "Failed to update password.";

    return {
      error: message,
    };
  }
}

/**
 * Changes the password for an already authenticated user.
 */
export async function changePassword(
  _prevState: AuthActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<AuthActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;

  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || password.length < 8) {
    return { error: "Password must contain at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be signed in to change your password." };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message || "Failed to update password." };

    return { success: true, message: "Password updated successfully." };
  } catch {
    return { error: "Unable to update your password. Please try again." };
  }
}

// Aliases for backwards compatibility with existing UI callers
export const signInAction = signInWithPassword;
export const signUpAction = signUpWithPassword;
export const signOutAction = signOut;
export const forgotPasswordAction = requestPasswordReset;
export const resetPasswordAction = updatePassword;