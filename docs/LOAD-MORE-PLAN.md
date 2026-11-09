# Plan: "Load more" in Recent Activity

**Status:** planned, not started. Branch `claude/happy-einstein-mntpu3`.

## Goal

Recent Activity shows the 10 most recent entries. A **Load more** button under the table appends the next 10 older entries. The button disappears once there are no more. Clicking the button, or anywhere in the table, does not collapse the panel.

## Design

- **Paging by time, not by Airtable offset.** Each "Load more" asks for the 10 newest entries older than the last row shown. Each request stands alone, so there is no server-side page state to expire.
- **Response shape stays an array.** No change for existing callers.
- **Out of scope:** entries with identical timestamps (one could be skipped across a page boundary). Accepted.

## 1. Data function: `functions/getBathroom.mjs`

- Add an optional `before` query setting: an ISO date-time.
  - Validate with `Date.parse`; invalid gives a 400 `before must be an ISO date-time`.
  - Re-serialize with `new Date(raw).toISOString()` before putting it in the formula, so raw input never reaches Airtable.
  - `before` together with `days` gives a 400 `use before or days, not both`.
- When `before` is set: `maxRecords=10` and `filterByFormula=IS_BEFORE({Time}, DATETIME_PARSE('<iso>'))`. Sort stays `Time` descending.
- No `before` and no `days`: unchanged (10 most recent).
- Update the header comment to list `before`.

## 2. Mock: `functions/_shared/mockAirtable.mjs`

- In `list`, also match `IS_BEFORE(...DATETIME_PARSE('<iso>'))` in `filterByFormula` and keep records with `Time` earlier than that value. The `maxRecords` slice already exists.

## 3. Frontend: `src/components/RecentActivity.jsx`

- **Stop the collapse:** move `onClick={toggle}` from `Container` to the "Show/Hide Recent" heading, and give the heading `cursor: pointer`. Only the heading opens and closes the panel. Clicking the table does nothing, and clicking Load more loads entries without collapsing the panel.
- **State:** add `hasMore` and `loadingMore` next to `visits`. Add `const PAGE_SIZE = 10;` with a comment that it must match `DEFAULT_LIMIT` in `getBathroom.mjs`.
- **First load (on open):** as now, plus `setHasMore(page.length === PAGE_SIZE)`.
- **`loadMore`:**
  1. `setLoadingMore(true)`.
  2. Fetch `/.netlify/functions/getBathroom?before=${encodeURIComponent(last.time)}`, where `last` is the final row in `visits`.
  3. Append: `setVisits((v) => [...v, ...page])`; `setHasMore(page.length === PAGE_SIZE)`.
  4. On error, `console.error` and leave the button in place so it can be retried.
  5. `setLoadingMore(false)` in `finally`.
- **Button:** below the table, rendered only when `hasMore`. `<button type="button" className="nes-btn" disabled={loadingMore}>`, label "Load more", or "Loading..." while fetching. Matches the `nes-btn` buttons in `ActionOptions.jsx` and `BathroomOptions.jsx`.
- If exactly 10 entries remain, the last click returns 0 rows and the button then disappears. Accepted.

## 4. Tests: `tests/functions.test.mjs`

- `before` sets `maxRecords=10` and the `IS_BEFORE` formula with the normalized ISO value.
- Invalid `before` (`abc`, empty date) gives 400 with no Airtable call.
- `before` plus `days` gives 400 with no Airtable call.
- Mock mode: `?before=<time of 3rd newest sample>` returns only older samples, newest first.

## 5. Docs

- README Functions table: add the `before` row.
- `PROPOSAL.md`: list "Load more" under Phase 1 once done, and drop it from the Phase 3 candidates ("paging").

## 6. Verify

1. `npm test` and `CI=true npm run build` pass.
2. Live Airtable (33 records): with the dev server running, `curl '...getBathroom?before=2020-12-06T12:56:32.941Z'` returns 10 rows, all older than that time.
3. In the browser: open Recent Activity, click Load more 3 times. Expect 10, 20, 30, 33 rows, then no button. Clicking the table or button never collapses the panel; clicking the heading still does.
4. Commit and push to the branch.
