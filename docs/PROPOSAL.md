# Proposal: Restore and Upgrade the Dahlia Tracker

**Status:** Phase 1 is implemented on branch `claude/happy-einstein-mntpu3` and runs against mock data. It still needs a review of the UI, a live test against Airtable, and a Netlify deploy.

## Goal

Get the app building and deploying on Netlify on a supported Node.js version, reconnect it to the existing Airtable base, and show historical data.

## Why the build failed

| Area | Finding |
| --- | --- |
| Node version | Create React App 4 can't build on Node 18 or later. Netlify now defaults to Node 24. |
| Lint in CI | Netlify sets `CI=true`, which turns 5 lint warnings into build errors. |
| Lockfiles | `yarn.lock` was out of date and is used ahead of `package-lock.json`. |
| Airtable auth | Airtable stopped accepting API keys in February 2024. A Personal Access Token is required. |
| History view | `getBathroom` returned only the last ~1 day, up to 100 records. |

## Approaches evaluated

| Approach | Result | Decision |
| --- | --- | --- |
| A. Pin Node 16, keep Create React App | Builds. Node 16 is end-of-life, and Functions would run on a different Node version than the build. 212 known vulnerabilities remain. | Rejected |
| B. Move the build to Vite on Node 24 | Builds and looks the same as before. 0 known vulnerabilities. 24 files changed, with no logic changes. | **Adopted** |
| C. Rewrite the Functions as Netlify Functions v2 using `fetch` | Removes the `airtable` library. Adds input validation and clear error messages. | **Adopted** |

## Phase 1: Restore on current versions (done, pending review)

- **Build:** Vite 8, Node 24 (`netlify.toml`), single npm lockfile.
- **Frontend:** React 19, styled-components 6. No behavior changes.
- **Functions:** Netlify Functions v2 calling the Airtable REST API directly.
  - `getBathroom` returns the 10 most recent entries by default; `?days=N` returns the last N days, and `days=all` returns everything. It follows Airtable's paging.
  - `?before=<ISO time>` returns the 10 newest entries older than that time; Recent Activity uses it for a "Load more" button.
  - `saveBathroom` validates the submitted entry.
- **Local mock:** `npm run dev:netlify` serves sample data with no Airtable account.
- **Tests:** `npm test` runs 17 function tests.
- **Docs:** the README has setup, environment variables, and deploy steps.

### Verified

- `CI=true npm run build` passes on Node 24, and `npm audit` reports 0 vulnerabilities.
- In a browser against mock data: Recent Activity loads, logging an entry saves it, and the new entry appears after reload. No console errors.
- Not yet verified: a live Airtable connection and a Netlify deploy.

## Owner actions

1. Confirm that the Airtable base and table still exist. The fields are `Time`, `Notes`, `Pee`, `Poop` and `Accident`.
2. Create a Personal Access Token:
   - scopes `data.records:read` and `data.records:write`
   - access limited to this base
3. In Netlify, set `AIRTABLE_TOKEN`, `AIRTABLE_BASE` and `AIRTABLE_TABLE`. Remove `AIRTABLE_API_KEY`.
4. Review the UI locally (`npm install && npm run dev:netlify`) or from a Netlify deploy preview of the branch.

## Decisions needed

1. **Save validation:** the save function now requires Pee or Poop to be checked, which matches the form. Keep it?

## Next phases

- **Phase 2: Login and separate data per user.** Netlify Identity is deprecated, so use an external provider; Clerk is the lowest effort. Add a `UserId` field and filter by it in the Functions.
  - Airtable's free plan allows 1,000 records per base and 1,000 API calls per month. If usage outgrows that, move to Supabase (auth plus Postgres) in this phase.
- **Phase 3: TBD.** Candidates: date filters in Recent Activity, and editing or deleting entries.
