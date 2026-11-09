// POST /.netlify/functions/saveBathroom
// Accepts what the frontend sends today, a plain fields object:
//   { Notes, Pee, Poop, Time, Accident }
// and also { fields: {...} }, { records: [...] } or an array of either.
import { airtableFetch, errorResponse, getConfig, HttpError, json } from './_shared/airtable.mjs';

const BOOLEAN_FIELDS = ['Pee', 'Poop', 'Accident'];
const ALLOWED_FIELDS = new Set(['Notes', 'Time', ...BOOLEAN_FIELDS]);
const MAX_NOTES_LENGTH = 10000;
const MAX_RECORDS = 50;
const BATCH_SIZE = 10; // Airtable creates at most 10 records per request.

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecordList(body) {
  if (Array.isArray(body)) return body;
  if (isPlainObject(body) && Array.isArray(body.records)) return body.records;
  return [body];
}

// Returns { fields } with only whitelisted, type-checked fields. Unknown keys
// are rejected rather than dropped so mistakes show up during development.
function sanitize(input, index) {
  const raw = isPlainObject(input) && isPlainObject(input.fields) ? input.fields : input;
  const where = `record ${index}`;
  if (!isPlainObject(raw)) throw new HttpError(400, `${where}: expected an object of fields`);

  const unknown = Object.keys(raw).filter((key) => !ALLOWED_FIELDS.has(key));
  if (unknown.length) throw new HttpError(400, `${where}: unknown field(s) ${unknown.join(', ')}`);

  const fields = {};
  if (raw.Notes != null) {
    if (typeof raw.Notes !== 'string') throw new HttpError(400, `${where}: Notes must be a string`);
    if (raw.Notes.length > MAX_NOTES_LENGTH) throw new HttpError(400, `${where}: Notes is too long`);
    fields.Notes = raw.Notes;
  }
  for (const key of BOOLEAN_FIELDS) {
    if (raw[key] == null) continue;
    if (typeof raw[key] !== 'boolean') throw new HttpError(400, `${where}: ${key} must be true or false`);
    fields[key] = raw[key];
  }
  if (raw.Time != null) {
    const time = typeof raw.Time === 'string' ? new Date(raw.Time) : null;
    if (!time || Number.isNaN(time.getTime())) {
      throw new HttpError(400, `${where}: Time must be an ISO 8601 date string`);
    }
    fields.Time = time.toISOString();
  }
  if (!fields.Pee && !fields.Poop) throw new HttpError(400, `${where}: Pee or Poop must be true`);
  return { fields };
}

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ err: 'That method is not allowed' }, 405, { allow: 'POST' });
  }
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'Request body must be valid JSON');
    }

    const many = Array.isArray(body) || Array.isArray(body?.records);
    const input = toRecordList(body);
    if (input.length === 0) throw new HttpError(400, 'No records to save');
    if (input.length > MAX_RECORDS) throw new HttpError(400, `At most ${MAX_RECORDS} records per request`);
    const records = input.map(sanitize);

    const { token, url } = getConfig();
    // The values already match the field types (checkbox, long text, date), so
    // typecast stays off and Airtable answers a mismatch with a 422.
    // Batches go one after another to stay under 5 requests per second.
    const created = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const result = await airtableFetch(url, token, {
        method: 'POST',
        body: JSON.stringify({ records: records.slice(i, i + BATCH_SIZE) }),
      });
      created.push(...(result.records ?? []));
    }

    // Echo what was saved, as the v1 function did.
    const saved = created.map((record) => ({ id: record.id, ...record.fields }));
    return json(many ? saved : saved[0]);
  } catch (err) {
    return errorResponse(err);
  }
};
