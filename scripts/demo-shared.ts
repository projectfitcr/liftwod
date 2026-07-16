import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PROJECT_REF = "mywwdnvrkdafujshwiqk";
export const DEMO_EMAIL_SUFFIX = "@demo.liftwod";
export const DEMO_PASSWORD = "Thailand1";
export const DEMO_MARKER = "[LIFTWOD_DEMO]";
export const PROTECTED_ADMIN_EMAIL = "jkarum@gmail.com";

// These maintenance scripts intentionally address tables dynamically so the
// cleanup ordering can stay in one small helper. Runtime safety comes from the
// hard project-ref guard above; app code continues to use generated DB types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminClient = SupabaseClient<any>;

export function createAdminClient(): AdminClient {
  const envFile = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const env: Record<string, string> = {};

  for (const line of envFile.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = env.SUPABASE_SECRET_KEY;
  if (!url?.includes(PROJECT_REF)) {
    throw new Error(`Refusing to modify data: unexpected Supabase URL ${url}`);
  }
  if (!secret) throw new Error("SUPABASE_SECRET_KEY missing from .env.local");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listAllAuthUsers(client: AdminClient) {
  const users = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  return users;
}

async function checked<T extends { error: unknown }>(
  operation: PromiseLike<T>,
  label: string,
): Promise<T> {
  const result = await operation;
  if (result.error) {
    const detail =
      result.error instanceof Error
        ? result.error.message
        : JSON.stringify(result.error);
    throw new Error(`${label}: ${detail}`);
  }
  return result;
}

async function deleteIn(
  client: AdminClient,
  table: string,
  column: string,
  values: string[],
) {
  if (values.length === 0) return;
  await checked(
    client.from(table).delete().in(column, values),
    `delete ${table}.${column}`,
  );
}

async function nullIn(
  client: AdminClient,
  table: string,
  column: string,
  values: string[],
) {
  if (values.length === 0) return;
  await checked(
    client.from(table).update({ [column]: null }).in(column, values),
    `clear ${table}.${column}`,
  );
}

/**
 * Removes rows owned by the demo accounts. By default the auth identities are
 * kept so the seed can reset passwords and repopulate data idempotently.
 */
export async function clearScopedDemoData(
  client: AdminClient,
  { deleteUsers }: { deleteUsers: boolean },
) {
  const authUsers = await listAllAuthUsers(client);
  const demoUsers = authUsers.filter((user) =>
    user.email?.endsWith(DEMO_EMAIL_SUFFIX),
  );
  const demoIds = demoUsers.map((user) => user.id);
  if (demoIds.length === 0) return { users: 0 };

  const { data: profiles } = await checked(
    client.from("profiles").select("id, role").in("id", demoIds),
    "select demo profiles",
  );
  const demoCoachIds = (profiles ?? [])
    .filter((profile) => profile.role === "coach")
    .map((profile) => profile.id);

  const { data: workouts } = await checked(
    client.from("workouts").select("id, coach_notes, created_by, updated_by"),
    "select workouts",
  );
  const demoWorkoutIds = (workouts ?? [])
    .filter(
      (workout) =>
        workout.coach_notes?.startsWith(DEMO_MARKER) ||
        (workout.created_by && demoCoachIds.includes(workout.created_by)),
    )
    .map((workout) => workout.id);

  const { data: sessions } = await checked(
    client.from("class_sessions").select("id, coach_id, workout_id"),
    "select sessions",
  );
  const demoSessionIds = (sessions ?? [])
    .filter(
      (session) =>
        (session.coach_id && demoCoachIds.includes(session.coach_id)) ||
        (session.workout_id && demoWorkoutIds.includes(session.workout_id)),
    )
    .map((session) => session.id);

  const { data: memberships } = await checked(
    client.from("memberships").select("id").in("member_id", demoIds),
    "select demo memberships",
  );
  const demoMembershipIds = (memberships ?? []).map(
    (membership) => membership.id,
  );

  // Delete dependent activity before the parent sessions, memberships, and users.
  await deleteIn(client, "notification_outbox", "member_id", demoIds);
  await deleteIn(client, "notes", "member_id", demoIds);
  await deleteIn(client, "notes", "author_id", demoIds);
  await deleteIn(client, "results", "member_id", demoIds);
  await deleteIn(client, "results", "session_id", demoSessionIds);
  await deleteIn(client, "attendance", "member_id", demoIds);
  await deleteIn(client, "attendance", "session_id", demoSessionIds);
  await deleteIn(client, "attendance", "membership_id", demoMembershipIds);
  await deleteIn(client, "bookings", "member_id", demoIds);
  await deleteIn(client, "bookings", "session_id", demoSessionIds);
  await deleteIn(client, "payments", "membership_id", demoMembershipIds);
  await deleteIn(client, "payments", "recorded_by", demoIds);
  await deleteIn(client, "holds", "membership_id", demoMembershipIds);
  await deleteIn(client, "invites", "created_by", demoIds);
  await deleteIn(client, "invites", "used_by", demoIds);

  // Remove references a tester may have created outside the seeded rows.
  await nullIn(client, "attendance", "checked_in_by", demoIds);
  await nullIn(client, "bookings", "cancelled_by", demoIds);
  await nullIn(client, "results", "entered_by", demoIds);
  await nullIn(client, "memberships", "created_by", demoIds);
  await nullIn(client, "holds", "created_by", demoIds);
  await nullIn(client, "profiles", "approved_by", demoIds);
  await nullIn(client, "workouts", "updated_by", demoIds);

  await deleteIn(client, "memberships", "member_id", demoIds);
  await deleteIn(client, "class_sessions", "id", demoSessionIds);

  const { data: templates } = await checked(
    client.from("class_templates").select("id, coach_id"),
    "select templates",
  );
  const demoTemplateIds = (templates ?? [])
    .filter(
      (template) =>
        template.coach_id && demoCoachIds.includes(template.coach_id),
    )
    .map((template) => template.id);
  await deleteIn(client, "class_templates", "id", demoTemplateIds);
  await deleteIn(client, "workouts", "id", demoWorkoutIds);

  if (deleteUsers) {
    for (const user of demoUsers) {
      const { error } = await client.auth.admin.deleteUser(user.id);
      if (error) throw error;
    }
  }

  return { users: demoUsers.length };
}

async function deleteAll(client: AdminClient, table: string) {
  await checked(
    client.from(table).delete().not("id", "is", null),
    `delete all ${table}`,
  );
}

/**
 * Destructive reset used only with two explicit guards in clear-demo.ts.
 * Reference locations, plans, benchmarks, and exercises remain intact.
 */
export async function clearAllExceptAdmin(
  client: AdminClient,
  keepAdminEmail: string,
) {
  const authUsers = await listAllAuthUsers(client);
  const keep = authUsers.find(
    (user) => user.email?.toLowerCase() === keepAdminEmail.toLowerCase(),
  );
  if (!keep) throw new Error(`Protected admin ${keepAdminEmail} was not found`);

  const { data: profile } = await checked(
    client.from("profiles").select("role").eq("id", keep.id).single(),
    "verify protected admin",
  );
  if (profile?.role !== "admin") {
    throw new Error(`${keepAdminEmail} is not an admin; refusing to clear`);
  }

  await deleteAll(client, "notification_outbox");
  await deleteAll(client, "prs");
  await deleteAll(client, "results");
  await deleteAll(client, "attendance");
  await deleteAll(client, "bookings");
  await deleteAll(client, "notes");
  await deleteAll(client, "payments");
  await deleteAll(client, "holds");
  await deleteAll(client, "memberships");
  await deleteAll(client, "invites");
  await deleteAll(client, "class_sessions");
  await deleteAll(client, "class_templates");
  await checked(
    client.from("workouts").delete().eq("is_baseline", false),
    "delete non-baseline workouts",
  );
  await checked(
    client
      .from("workouts")
      .update({ created_by: null, updated_by: null })
      .eq("is_baseline", true),
    "clear baseline workout owners",
  );
  await checked(
    client
      .from("profiles")
      .update({ approved_by: null })
      .not("id", "is", null),
    "clear profile approvers",
  );

  let deleted = 0;
  for (const user of authUsers) {
    if (user.id === keep.id) continue;
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error) throw error;
    deleted += 1;
  }

  return { deleted, kept: keepAdminEmail };
}
