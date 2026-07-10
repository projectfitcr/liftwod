import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client — bypasses RLS. Allowed uses (CLAUDE.md): the session
 * generation cron, auth admin operations (seeding/inviting), and the
 * notification outbox drainer. Everything an admin does in the UI goes
 * through user-context RLS instead, for real audit trails.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
