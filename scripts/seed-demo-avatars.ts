/**
 * Assigns stable profile portraits to LiftWOD's seeded demo/test accounts.
 * It intentionally ignores every other account, including the real admin.
 *
 * Run: npm run demo:avatars
 */
import {
  DEMO_EMAIL_SUFFIX,
  createAdminClient,
  listAllAuthUsers,
  seededAvatarUrl,
} from "./demo-shared.ts";

const TEST_EMAIL_SUFFIX = "@test.liftwod";

async function main() {
  const client = createAdminClient();
  const authUsers = await listAllAuthUsers(client);
  const seededUsers = authUsers.filter((user) =>
    [DEMO_EMAIL_SUFFIX, TEST_EMAIL_SUFFIX].some((suffix) =>
      user.email?.toLowerCase().endsWith(suffix),
    ),
  );

  if (seededUsers.length === 0) {
    console.log("No seeded demo/test accounts found.");
    return;
  }

  for (const user of seededUsers) {
    const email = user.email!;
    const { error } = await client
      .from("profiles")
      .update({ avatar_url: seededAvatarUrl(email) })
      .eq("id", user.id);
    if (error) throw error;
    console.log(`avatar  ${email}`);
  }

  console.log(`\nAssigned portraits to ${seededUsers.length} seeded accounts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
