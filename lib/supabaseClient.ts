import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  // 1. Prioritize environment variables (.env files)
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envAnonKey) {
    try {
      return createClient(envUrl, envAnonKey);
    } catch (e) {
      console.error("Failed to initialize Supabase client from environment variables:", e);
    }
  }

  // 2. Fallback to settings configured in the UI dashboard
  if (typeof window !== "undefined") {
    let settings: any = {};
    try {
      const stored = localStorage.getItem("colormind_settings");
      if (stored) settings = JSON.parse(stored);
    } catch {}

    if (settings.useSupabase && settings.supabaseUrl && settings.supabaseAnonKey) {
      try {
        return createClient(settings.supabaseUrl, settings.supabaseAnonKey);
      } catch (e) {
        console.error("Failed to initialize Supabase client from dashboard settings:", e);
      }
    }
  }

  return null;
}
