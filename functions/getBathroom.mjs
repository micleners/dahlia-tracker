// GET /.netlify/functions/getBathroom?days=30
//   days: whole number of days to look back, or "all".
//   Without days, returns the 10 most recent entries.
// GET /.netlify/functions/getBathroom?before=2026-11-07T12:00:00.000Z
//   before: ISO date-time; returns the 10 newest entries older than it.
//   Cannot be combined with days.
// Responds with [{ notes, pee, poop, time, accident }], newest first.
import { airtableFetch, errorResponse, getConfig, HttpError, json } from './_shared/airtable.mjs';

const DEFAULT_LIMIT = 10;
const MAX_DAYS = 3650;
// Safety cap of 50 pages x 100 records. Pages are fetched one after another,
// which stays under Airtable's limit of 5 requests per second per base.
const MAX_PAGES = 50;
const FIELDS = ['Notes', 'Pee', 'Poop', 'Time', 'Accident'];

function parseDays(raw) {
  if (raw === null || raw === '') return undefined;
  if (raw.toLowerCase() === 'all') return null;
  if (!/^\d+$/.test(raw)) throw new HttpError(400, 'days must be a positive whole number or "all"');
  const days = Number(raw);
  if (days < 1 || days > MAX_DAYS) throw new HttpError(400, `days must be between 1 and ${MAX_DAYS}`);
  return days;
}

function parseBefore(raw) {
  if (raw === null) return undefined;
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) throw new HttpError(400, 'before must be an ISO date-time');
  // Re-serialize so raw input never reaches the Airtable formula.
  return new Date(ms).toISOString();
}

export default async (req) => {
  if (req.method !== 'GET') {
    return json({ err: 'That method is not allowed' }, 405, { allow: 'GET' });
  }
  try {
    const query = new URL(req.url).searchParams;
    const days = parseDays(query.get('days'));
    const before = parseBefore(query.get('before'));
    if (before !== undefined && days !== undefined) throw new HttpError(400, 'use before or days, not both');
    const { token, url } = getConfig();

    const params = new URLSearchParams();
    params.set('pageSize', '100');
    params.set('sort[0][field]', 'Time');
    params.set('sort[0][direction]', 'desc');
    for (const field of FIELDS) params.append('fields[]', field);
    if (before !== undefined) {
      params.set('maxRecords', String(DEFAULT_LIMIT));
      params.set('filterByFormula', `IS_BEFORE({Time}, DATETIME_PARSE('${before}'))`);
    } else if (days === undefined) {
      params.set('maxRecords', String(DEFAULT_LIMIT));
    } else if (days !== null) {
      params.set('filterByFormula', `DATETIME_DIFF(NOW(),{Time},'days')<=${days}`);
    }

    const records = [];
    let offset;
    let pages = 0;
    do {
      if (offset) params.set('offset', offset);
      const page = await airtableFetch(`${url}?${params}`, token);
      records.push(...(page.records ?? []));
      offset = page.offset;
      pages += 1;
    } while (offset && pages < MAX_PAGES);

    return json(
      records.map(({ fields = {} }) => ({
        notes: fields.Notes,
        pee: fields.Pee,
        poop: fields.Poop,
        time: fields.Time,
        accident: fields.Accident,
      })),
    );
  } catch (err) {
    return errorResponse(err);
  }
};
