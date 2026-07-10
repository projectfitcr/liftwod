"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Live board: refresh the server-rendered page on any results change
 * (Supabase Realtime, RLS-authed subscriber) with a polling fallback.
 * Boring and correct at gym scale.
 */
export function RealtimeRefresh({ pollMs = 30000 }: { pollMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("results-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => router.refresh()
      )
      .subscribe();

    const interval = setInterval(() => router.refresh(), pollMs);
    return () => {
      void supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [router, pollMs]);

  return null;
}
