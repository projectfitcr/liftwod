-- Advisor follow-ups after the initial schema push.
--
-- NOT fixed (intentional, documented in CLAUDE.md): security_definer_view on
-- member_directory and session_availability — owner-rights is the mechanism
-- that lets members see names/capacity without opening profiles/bookings RLS.

-- btree_gist belongs in the extensions schema, not public.
alter extension btree_gist set schema extensions;

-- Trigger functions are invoked by their triggers, never via the API — no
-- role needs EXECUTE on them.
revoke execute on function
  public.handle_new_user(),
  public.sync_user_email(),
  public.enforce_profile_integrity(),
  public.set_updated_at(),
  public.results_before_write(),
  public.results_after_write()
from public, anon, authenticated;
