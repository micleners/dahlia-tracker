// Local stand-in for the Airtable REST API, used when AIRTABLE_MOCK=true.
// Supports what the functions use: list (days or before filter, sort by Time desc,
// maxRecords, pageSize/offset) and create. Each function call runs in a fresh process, so
// records are kept in a JSON file in the OS temp folder (or AIRTABLE_MOCK_FILE).
// Delete it to reset.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HOUR = 60 * 60 * 1000;
const store = () => process.env.AIRTABLE_MOCK_FILE || join(tmpdir(), 'dahlia-tracker-mock.json');

function makeRecord(fields) {
  return { id: `recMock${randomUUID().slice(0, 8)}`, createdTime: new Date().toISOString(), fields };
}

const sampleRecords = () => [
  { hoursAgo: 1, Pee: true, Poop: false, Accident: false, Notes: 'Morning walk' },
  { hoursAgo: 5, Pee: true, Poop: true, Accident: false, Notes: '' },
  { hoursAgo: 9, Pee: true, Poop: false, Accident: true, Notes: 'Kitchen rug' },
  { hoursAgo: 30, Pee: false, Poop: true, Accident: false, Notes: '' },
  { hoursAgo: 24 * 10, Pee: true, Poop: false, Accident: false, Notes: '10 days ago' },
  { hoursAgo: 24 * 45, Pee: true, Poop: true, Accident: true, Notes: '45 days ago' },
].map(({ hoursAgo, ...fields }) =>
  makeRecord({ ...fields, Time: new Date(Date.now() - hoursAgo * HOUR).toISOString() }),
);

function load() {
  if (!existsSync(store())) writeFileSync(store(), JSON.stringify(sampleRecords()));
  return JSON.parse(readFileSync(store(), 'utf8'));
}

function list(searchParams) {
  const days = searchParams.get('filterByFormula')?.match(/<=(\d+)$/)?.[1];
  const cutoff = Date.now() - Number(days) * 24 * HOUR;
  const before = searchParams.get('filterByFormula')?.match(/IS_BEFORE\(.*DATETIME_PARSE\('([^']+)'\)\)/)?.[1];
  const time = (r) => Date.parse(r.fields.Time) || 0;
  const matches = load()
    .filter((r) => !days || time(r) >= cutoff)
    .filter((r) => !before || time(r) < Date.parse(before))
    .sort((a, b) => time(b) - time(a))
    .slice(0, Number(searchParams.get('maxRecords')) || undefined);

  const pageSize = Number(searchParams.get('pageSize') || 100);
  const start = Number(searchParams.get('offset') || 0);
  const end = start + pageSize;
  return {
    records: matches.slice(start, end),
    ...(end < matches.length ? { offset: String(end) } : {}),
  };
}

function create(body) {
  const created = JSON.parse(body).records.map(({ fields }) => makeRecord(fields));
  writeFileSync(store(), JSON.stringify([...load(), ...created]));
  return { records: created };
}

export async function mockAirtableFetch(url, init = {}) {
  return init.method === 'POST' ? create(init.body) : list(new URL(url).searchParams);
}
