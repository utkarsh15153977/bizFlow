import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return false;
  if (
    url.includes("YOUR_PROJECT_ID") ||
    url.includes("placeholder.supabase.co") ||
    key.includes("YOUR_PUBLISHABLE_KEY") ||
    key.includes("placeholder-key")
  ) {
    return false;
  }
  return true;
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey || !isSupabaseConfigured()) {
    // Return dummy client during build/preview when env vars are not set
    return createBrowserClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}