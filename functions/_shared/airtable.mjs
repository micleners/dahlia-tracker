// Shared helpers for the Airtable-backed Netlify Functions (v2).
// Lives in a subdirectory and is not named after it (or "index"), so Netlify
// bundles it into the functions that import it instead of deploying it alone.

import { mockAirtableFetch } from './mockAirtable.mjs';

const API_ROOT = 'https://api.airtable.com/v0';

function readEnv(name) {
  const fromNetlify = globalThis.Netlify?.env?.get?.(name);
  return fromNetlify ?? process.env[name];
}

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// AIRTABLE_MOCK=true serves sample data from memory instead of calling Airtable.
const isMock = () => readEnv('AIRTABLE_MOCK') === 'true';

export function getConfig() {
  if (isMock()) return { token: 'mock', url: `${API_ROOT}/mockBase/mockTable` };
  // AIRTABLE_TOKEN is a Personal Access Token. AIRTABLE_API_KEY is accepted as
  // a fallback so an existing site keeps working once that variable holds a PAT.
  const token = readEnv('AIRTABLE_TOKEN') || readEnv('AIRTABLE_API_KEY');
  const base = readEnv('AIRTABLE_BASE');
  const table = readEnv('AIRTABLE_TABLE');
  const missing = [];
  if (!token) missing.push('AIRTABLE_TOKEN');
  if (!base) missing.push('AIRTABLE_BASE');
  if (!table) missing.push('AIRTABLE_TABLE');
  if (missing.length) {
    throw new HttpError(500, `Server misconfigured: missing ${missing.join(', ')}`);
  }
  return {
    token,
    url: `${API_ROOT}/${encodeURIComponent(base)}/${encodeURIComponent(table)}`,
  };
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    const body = { err: err.message };
    if (err.details) body.details = err.details;
    return json(body, err.status);
  }
  console.error('Unexpected error:', err?.message ?? err);
  return json({ err: 'Unexpected server error' }, 500);
}

// Calls Airtable and turns its error responses into HttpErrors. Messages are
// built here or taken from Airtable's error body; the token is never included.
export async function airtableFetch(url, token, init = {}) {
  if (isMock()) return mockAirtableFetch(url, init);
  let res;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    });
  } catch (err) {
    console.error('Airtable request failed:', err?.message ?? err);
    throw new HttpError(502, 'Could not reach Airtable');
  }

  if (res.ok) return res.json();

  let airtableError;
  try {
    airtableError = (await res.json())?.error;
  } catch {
    // Non-JSON error body; nothing to add.
  }
  const type = typeof airtableError === 'string' ? airtableError : airtableError?.type;
  const message = typeof airtableError === 'object' ? airtableError?.message : undefined;
  console.error(`Airtable ${res.status}`, type ?? '', message ?? '');

  switch (res.status) {
    case 401:
    case 403:
      throw new HttpError(
        502,
        'Airtable rejected the credentials (check AIRTABLE_TOKEN scopes and base access)',
        { type },
      );
    case 404:
      throw new HttpError(502, 'Airtable base or table not found (check AIRTABLE_BASE and AIRTABLE_TABLE)', {
        type,
      });
    case 422:
      throw new HttpError(400, 'Airtable rejected the request', { type, message });
    case 429:
      throw new HttpError(503, 'Airtable rate limit reached; try again in 30 seconds', { type });
    default:
      throw new HttpError(502, `Airtable error (${res.status})`, { type });
  }
}
