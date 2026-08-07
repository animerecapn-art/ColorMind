"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { getSupabaseClient } from "../lib/supabaseClient";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const supabase = getSupabaseClient();

  useEffect(() => {
    // If Supabase is not configured, bypass authentication guard (offline/guest mode)
    if (!supabase) return;

    if (!loading) {
      if (!user && pathname !== "/login") {
        router.replace("/login");
      } else if (user && pathname === "/login") {
        router.replace("/inspector");
      }
    }
  }, [user, loading, pathname, router, supabase]);

  // While loading user profile session, render loading skeleton
  if (supabase && loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">
          Verifying session...
        </p>
      </div>
    );
  }

  // Prevent loading content flash for unauthenticated users redirecting to login page
  if (supabase && !user && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">
          Redirecting to Login...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
