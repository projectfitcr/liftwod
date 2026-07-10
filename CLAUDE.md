# LIFTwod

LIFTwod app (early scaffold — project structure not yet built). This file documents conventions and guardrails for working in this repo.

## Account & project safety

LIFTwod runs on **different Vercel and Supabase accounts** than Joel's other apps in `~/ClaudeCode/` (ezekiel-rain-me-tool, oxcart). The access split is deliberate: the **MCP connectors stay authenticated to the ER accounts** for the other apps, while **all LIFTwod work uses CLIs with scoped tokens from this folder's `.env.local`** — each token's account/team contains only this project, so it physically cannot touch ER infrastructure. Never use the Vercel or Supabase MCP connector tools for LIFTwod work, and never rely on ambient machine-wide logins.

### Correct accounts for this app

| Service | Account / org | Project |
|---|---|---|
| Vercel | `projectfitadmin-3368`, team `project-fit` (`team_FZmj1Rbb6U5C6kWs7eAb2QFZ`) | `liftwod` (`prj_ZASx2KPDx9wSHQnXyodY14SYyJNY`) |
| Supabase | New account, org `hndqrrjzcoowtzfdabgy` (separate from ER org) | "Lift WOD", ref `mywwdnvrkdafujshwiqk` — https://mywwdnvrkdafujshwiqk.supabase.co |

The **wrong** accounts (used by the other apps — if you see these identifiers, stop): Vercel `joelk-4154` / team `erthai-jk-projects`; Supabase org `syabeupsorncbswqlsvc` ("jkarum's Org").

### Pre-flight checks

- **Vercel CLI**: always pass the team-scoped token from this folder's `.env.local` instead of relying on the machine-wide `vercel login`:
  `vercel --token $(grep -m1 '^VERCEL_TOKEN=' .env.local | cut -d= -f2) <cmd>`
  The token is scoped to the `project-fit` team only and cannot see the ER team, so commands with it physically cannot land in the wrong account. Without `--token`, the CLI uses the global login — whatever that happens to be — so bare `vercel` commands are not safe here. `.vercel/project.json` pins deploys from this folder to `project-fit/liftwod`, but it does not protect account-level commands like `env` or `domains`. Sanity check: `vercel teams ls` with the token shows only `project-fit`.
- **Supabase — use the CLI, not the MCP connector.** The Supabase MCP connector is authenticated to the **old ER org and cannot see this project**; never use MCP Supabase tools (`execute_sql`, `apply_migration`, …) for LIFTwod work, and never "fall back" to a project the connector *can* see. All LIFTwod database work goes through the Supabase CLI.
- **Supabase CLI**: installed (binary in the nvm bin dir, v2.109+). Auth is a project-scoped personal access token stored as `SUPABASE_ACCESS_TOKEN` in this folder's `.env.local` — the token's account contains **only** the Lift WOD project, so it physically cannot touch ER projects. The CLI does not auto-read `.env.local`; run commands from this folder as:
  `SUPABASE_ACCESS_TOKEN=$(grep -m1 '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2) supabase <cmd>`
  The folder is linked to `mywwdnvrkdafujshwiqk` (`supabase/config.toml` committed; link state in `supabase/.temp/`). Sanity check: `supabase projects list` must show only the Lift WOD project.
- **Env cross-check**: `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` must be `https://mywwdnvrkdafujshwiqk.supabase.co`. Credentials live only in `.env.local` (gitignored); production env vars are managed on the Vercel `liftwod` project.
