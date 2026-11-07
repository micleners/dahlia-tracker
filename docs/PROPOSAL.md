# Proposal: Restore the Dahlia Tracker

**Status:** Draft for review. No application code has been changed.

## Goal

Get the app building and deploying on Netlify again, reconnect it to the existing Airtable base, and show historical data. Make the fewest changes possible, then improve the app in later phases.

## Current state (tested November 2026)

| Area | Finding | Impact |
| --- | --- | --- |
| Node version | `react-scripts` 4.0.1 fails on Node 18, 20 and 22. It builds on Node 16. Netlify now defaults to Node 22. | **Build fails** |
| Lint in CI | Netlify sets `CI=true`, which turns lint warnings into errors. `src/components/Dialog2.js` has 2 unused variables. | **Build fails** |
| Lockfiles | Both `yarn.lock` and `package-lock.json` are committed. `yarn.lock` is out of date (it's missing `airtable`). Netlify picks Yarn when `yarn.lock` exists. | **Install is unreliable** |
| Airtable auth | Airtable stopped accepting API keys (`AIRTABLE_API_KEY`) in February 2024. | **Data calls fail** |
| Functions | `exports.handler` (Functions v1) is still supported. `dotenv` is used but not listed in `package.json`. | Works, but fragile |
| History view | `getBathroom` returns only the last ~1 day and at most 100 records. | Old data is hidden |

## Phase 1: Restore (minimum changes)

### Code changes (one pull request)

1. **Pin Node 16** in `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     functions = "functions"

   [build.environment]
     NODE_VERSION = "16"
   ```
2. **Use one lockfile.** Delete `yarn.lock` and keep `package-lock.json`.
3. **Fix the 2 lint warnings** in `src/components/Dialog2.js`.
4. **Remove `require('dotenv').config()`** from both functions. Netlify adds environment variables itself, in production and in `netlify dev`.
5. **Show history.** Change `getBathroom` to return more than one day, with paging. The time window needs a decision (see Decisions).

### Manual setup (owner)

1. In Airtable, confirm the base and table still exist.
2. Create a **Personal Access Token** at airtable.com/create/tokens:
   - Scopes: `data.records:read`, `data.records:write`
   - Access: this base only
3. In Netlify, go to **Site configuration → Environment variables** and set:
   - `AIRTABLE_API_KEY`: the new token (same variable name, so the code doesn't change)
   - `AIRTABLE_BASE`: the base ID (starts with `app…`)
   - `AIRTABLE_TABLE`: the table name
4. Trigger a deploy and check that the form saves and Recent Activity loads.

### Risk and fallback

Node 16 is end-of-life. If Netlify won't install it, go straight to Phase 2, step 1. That's a small, mechanical change for an app of about 10 components.

## Phase 2: Update dependencies and build tools

1. Replace Create React App with **Vite**. This removes the Node 16 pin and lets the app build on the current Node LTS.
2. Upgrade React 17 to React 19, plus `styled-components` and the testing libraries.
3. Upgrade `airtable` to the latest version, or replace it with direct `fetch` calls.
4. Optionally move the functions to Netlify Functions v2 (`export default async (req) => Response`).
5. Replace the default README with short setup and deploy instructions.

## Phase 3: Login and separate data per user

Netlify Identity is deprecated, so use a free external login provider. Confirm current free-tier limits before choosing.

| Option | Effort | Notes |
| --- | --- | --- |
| Clerk (recommended) | Low | Prebuilt login UI; verify tokens in functions |
| Supabase Auth + Postgres | Medium | Adds a database with row-level security; Airtable would no longer be needed |
| Auth0 | Medium | Mature, more configuration |

Data model on Airtable: add a `UserId` field, set it in the function from the verified token, and filter by it on read. Airtable's free plan allows 1,000 records per base and 1,000 API calls per month. If usage grows past that, this phase is the point to move to Supabase.

## Phase 4: TBD

To be defined after Phase 1 ships.

## Decisions needed

1. **History window:** last 7 days, last 30 days, or all records with paging?
2. **Airtable access:** confirm the base is still available. If it isn't, Phase 1 needs a new table with the fields `Time`, `Notes`, `Pee`, `Poop`, `Accident`.
3. **Phase 1 approach:** is pinning Node 16 acceptable for now, or should we do the Vite migration in Phase 1?
