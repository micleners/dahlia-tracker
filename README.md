# Dahlia Tracker

A small app for logging a puppy's potty breaks. Built with React and Vite, hosted on Netlify, and stores data in Airtable through Netlify Functions.

## Requirements

- Node.js 22.12 or later (Netlify builds with Node 24, set in `netlify.toml`)

## Run locally

```sh
npm install
npm run dev:netlify
```

Open http://localhost:8888. This runs the app through the Netlify CLI, as on Netlify.

If the Netlify CLI is unavailable, use `npm run dev` (http://localhost:5173). Vite serves the same functions from `functions/` directly.

Both use sample data instead of Airtable (`AIRTABLE_MOCK=true`). Saved entries are kept in `dahlia-tracker-mock.json` in your OS temp folder; delete it to reset. To use real Airtable locally, set `AIRTABLE_MOCK=false` plus the variables below.

## Test and build

```sh
npm test        # function tests (Airtable is stubbed)
npm run build   # production build to dist/
```

## Deploy (Netlify)

Netlify builds from `netlify.toml`. No other build settings are needed.

Set these in **Site configuration → Environment variables**:

| Variable | Value |
| --- | --- |
| `AIRTABLE_TOKEN` | Airtable Personal Access Token with `data.records:read` and `data.records:write`, limited to this base |
| `AIRTABLE_BASE` | Base ID (starts with `app`) |
| `AIRTABLE_TABLE` | Table name |

The table needs these fields: `Time` (date and time), `Notes` (text), `Pee`, `Poop` and `Accident` (checkboxes).

## Functions

| Endpoint | Purpose |
| --- | --- |
| `GET /.netlify/functions/getBathroom?days=30` | Entries from the last N days, newest first. `days=all` returns everything. Without `days`, returns the 10 most recent. |
| `POST /.netlify/functions/saveBathroom` | Saves one entry: `{ "Time", "Notes", "Pee", "Poop", "Accident" }` |
