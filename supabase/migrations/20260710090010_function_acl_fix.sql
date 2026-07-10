-- Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE on new functions to
-- anon/authenticated/service_role explicitly — revoking from PUBLIC alone
-- doesn't remove those. Close the gap on the functions that must not be
-- callable by signed-in users directly.

revoke execute on function
  public.generate_sessions(integer),          -- cron/admin server action only
  public.result_norm_value(public.results),   -- internal helper
  public.evaluate_pr_lanes(public.results)    -- internal helper
from authenticated;
