/**
 * Safe default:
 *   npm run demo:clear
 *     Removes only @demo.liftwod users and their seeded/test activity.
 *
 * Guarded full reset:
 *   LIFTWOD_KEEP_ADMIN_EMAIL=jkarum@gmail.com \
 *   LIFTWOD_CONFIRM_CLEAR_ALL=DELETE_ALL_OTHER_USERS \
 *   npm run demo:clear -- --all-except-admin
 *
 * The full reset keeps the selected admin plus reference locations, plans,
 * exercises, and benchmarks. It clears all other users and operational data.
 */
import {
  PROTECTED_ADMIN_EMAIL,
  clearAllExceptAdmin,
  clearScopedDemoData,
  createAdminClient,
} from "./demo-shared.ts";

async function main() {
  const client = createAdminClient();
  const fullReset = process.argv.includes("--all-except-admin");

  if (!fullReset) {
    const result = await clearScopedDemoData(client, { deleteUsers: true });
    console.log(`Removed ${result.users} demo accounts and their demo data.`);
    console.log(`Protected admin: ${PROTECTED_ADMIN_EMAIL}`);
    return;
  }

  const keepAdmin = process.env.LIFTWOD_KEEP_ADMIN_EMAIL;
  const confirmation = process.env.LIFTWOD_CONFIRM_CLEAR_ALL;
  if (keepAdmin !== PROTECTED_ADMIN_EMAIL) {
    throw new Error(
      `Set LIFTWOD_KEEP_ADMIN_EMAIL=${PROTECTED_ADMIN_EMAIL} to run the full reset.`,
    );
  }
  if (confirmation !== "DELETE_ALL_OTHER_USERS") {
    throw new Error(
      "Set LIFTWOD_CONFIRM_CLEAR_ALL=DELETE_ALL_OTHER_USERS to run the full reset.",
    );
  }

  const result = await clearAllExceptAdmin(client, keepAdmin);
  console.log(`Deleted ${result.deleted} users and all operational app data.`);
  console.log(`Kept admin: ${result.kept}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
