/**
 * Seeds the four test users (admin/coach/member/pending @test.liftwod).
 * Idempotent — safe to re-run after any auth reset. Guards: only ever touches
 * @test.liftwod addresses, and only against the Lift WOD project.
 *
 * Run: npm run seed:users
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const envFile = readFileSync(join(process.cwd(), ".env.local"), "utf8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;
if (!url?.includes("mywwdnvrkdafujshwiqk")) {
  throw new Error(`Refusing to seed: unexpected Supabase URL ${url}`);
}
if (!secret) throw new Error("SUPABASE_SECRET_KEY missing from .env.local");

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = "liftwod-test-1234";

const USERS = [
  { email: "admin@test.liftwod", name: "Test Admin", role: "admin", approved: true },
  { email: "coach@test.liftwod", name: "Test Coach", role: "coach", approved: true },
  { email: "member@test.liftwod", name: "Test Member", role: "member", approved: true },
  { email: "pending@test.liftwod", name: "Test Pending", role: "member", approved: false },
] as const;

async function main() {
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) throw listError;

  for (const u of USERS) {
    if (!u.email.endsWith("@test.liftwod")) continue; // guard

    let id = existing.users.find((e) => e.email === u.email)?.id;
    if (!id) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: u.name, preferred_language: "en" },
      });
      if (error) throw error;
      id = data.user.id;
      console.log(`created ${u.email}`);
    } else {
      console.log(`exists  ${u.email}`);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: u.role,
        full_name: u.name,
        approved_at: u.approved ? new Date().toISOString() : null,
        is_active: true,
      })
      .eq("id", id);
    if (profileError) throw profileError;
  }

  console.log(`\nAll seeded. Password for every test user: ${PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
