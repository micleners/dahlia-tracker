import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Tests for the Netlify Functions. Airtable is replaced by a stubbed fetch.
// Run with: npm test
import getBathroom from '../functions/getBathroom.mjs';
import saveBathroom from '../functions/saveBathroom.mjs';

const TOKEN = 'patSECRET.abc123';
let calls;
let replies;

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => {
  delete process.env.AIRTABLE_MOCK;
  process.env.AIRTABLE_TOKEN = TOKEN;
  delete process.env.AIRTABLE_API_KEY;
  process.env.AIRTABLE_BASE = 'appBASE';
  process.env.AIRTABLE_TABLE = 'Bathroom Log';
  calls = [];
  replies = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), init });
    const next = replies.shift();
    if (!next) throw new Error('unexpected fetch');
    return typeof next === 'function' ? next() : next;
  };
});

const rec = (i) => ({ id: `rec${i}`, fields: { Notes: `n${i}`, Pee: true, Time: `2026-11-0${(i % 7) + 1}T10:00:00.000Z` } });

async function body(res) {
  const text = await res.text();
  assert.ok(!text.includes(TOKEN), 'token leaked in response');
  return JSON.parse(text);
}

const get = (qs = '') => getBathroom(new Request(`http://localhost/.netlify/functions/getBathroom${qs}`));
const post = (payload, init = {}) =>
  saveBathroom(
    new Request('http://localhost/.netlify/functions/saveBathroom', {
      method: 'POST',
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      ...init,
    }),
  );

test('GET default is 10 most recent, sorted desc, auth header, mapped shape', async () => {
  replies.push(reply(200, { records: [rec(1), { id: 'r2', fields: { Poop: true, Accident: true } }] }));
  const res = await get();
  assert.equal(res.status, 200);
  assert.deepEqual(await body(res), [
    { notes: 'n1', pee: true, time: '2026-11-02T10:00:00.000Z' },
    { poop: true, accident: true },
  ]);
  const { url, init } = calls[0];
  assert.equal(url.origin + url.pathname, 'https://api.airtable.com/v0/appBASE/Bathroom%20Log');
  assert.equal(init.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(url.searchParams.get('maxRecords'), '10');
  assert.equal(url.searchParams.has('filterByFormula'), false);
  assert.equal(url.searchParams.get('sort[0][field]'), 'Time');
  assert.equal(url.searchParams.get('sort[0][direction]'), 'desc');
  assert.deepEqual(url.searchParams.getAll('fields[]'), ['Notes', 'Pee', 'Poop', 'Time', 'Accident']);
});

test('GET days=7', async () => {
  replies.push(reply(200, { records: [] }));
  const res = await get('?days=7');
  assert.equal(res.status, 200);
  assert.deepEqual(await body(res), []);
  assert.equal(calls[0].url.searchParams.get('filterByFormula'), "DATETIME_DIFF(NOW(),{Time},'days')<=7");
});

test('GET days=30 explicit', async () => {
  replies.push(reply(200, { records: [] }));
  await get('?days=30');
  assert.match(calls[0].url.searchParams.get('filterByFormula'), /<=30$/);
  assert.equal(calls[0].url.searchParams.has('maxRecords'), false);
});

test('GET days=all has no filter and follows offset pagination', async () => {
  replies.push(reply(200, { records: Array.from({ length: 100 }, (_, i) => rec(i)), offset: 'itrA/recX' }));
  replies.push(reply(200, { records: Array.from({ length: 100 }, (_, i) => rec(i + 100)), offset: 'itrB/recY' }));
  replies.push(reply(200, { records: [rec(200)] }));
  const res = await get('?days=all');
  const data = await body(res);
  assert.equal(res.status, 200);
  assert.equal(data.length, 201);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url.searchParams.has('filterByFormula'), false);
  assert.equal(calls[0].url.searchParams.has('offset'), false);
  assert.equal(calls[1].url.searchParams.get('offset'), 'itrA/recX');
  assert.equal(calls[2].url.searchParams.get('offset'), 'itrB/recY');
  assert.equal(calls[2].url.searchParams.get('sort[0][field]'), 'Time');
});

test('GET bad days -> 400 without calling Airtable', async () => {
  for (const qs of ['?days=abc', '?days=0', '?days=-3', '?days=1.5', '?days=99999']) {
    const res = await get(qs);
    assert.equal(res.status, 400, qs);
  }
  assert.equal(calls.length, 0);
});

test('GET before sets maxRecords=10 and a normalized IS_BEFORE formula', async () => {
  replies.push(reply(200, { records: [] }));
  const res = await get('?before=2020-12-06T12:56:32.941Z');
  assert.equal(res.status, 200);
  const { searchParams } = calls[0].url;
  assert.equal(searchParams.get('maxRecords'), '10');
  assert.equal(searchParams.get('filterByFormula'), "IS_BEFORE({Time}, DATETIME_PARSE('2020-12-06T12:56:32.941Z'))");
  assert.equal(searchParams.get('sort[0][direction]'), 'desc');

  replies.push(reply(200, { records: [] }));
  await get('?before=2020-12-06T07:56:32-05:00');
  assert.match(calls[1].url.searchParams.get('filterByFormula'), /'2020-12-06T12:56:32\.000Z'\)\)$/);
});

test('GET bad before, or before with days -> 400 without calling Airtable', async () => {
  const bad = ['?before=abc', '?before=', "?before=2020-01-01')),TRUE(", '?before=2020-12-06T12:56:32.941Z&days=7'];
  for (const qs of bad) {
    const res = await get(qs);
    assert.equal(res.status, 400, qs);
  }
  assert.equal(calls.length, 0);
});

test('GET POST method -> 405', async () => {
  const res = await getBathroom(new Request('http://localhost/x', { method: 'POST', body: '{}' }));
  assert.equal(res.status, 405);
});

test('GET Airtable 401 -> 502, no token leak', async () => {
  replies.push(reply(401, { error: { type: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } }));
  const res = await get();
  assert.equal(res.status, 502);
  const data = await body(res);
  assert.match(data.err, /credentials/);
  assert.equal(data.details.type, 'AUTHENTICATION_REQUIRED');
});

test('GET network failure -> 502', async () => {
  replies.push(() => {
    throw new TypeError('fetch failed');
  });
  const res = await get();
  assert.equal(res.status, 502);
});

test('GET falls back to AIRTABLE_API_KEY; prefers Netlify.env', async () => {
  delete process.env.AIRTABLE_TOKEN;
  process.env.AIRTABLE_API_KEY = 'patLEGACYVAR';
  replies.push(reply(200, { records: [] }));
  await get();
  assert.equal(calls[0].init.headers.authorization, 'Bearer patLEGACYVAR');

  globalThis.Netlify = { env: { get: (k) => ({ AIRTABLE_TOKEN: 'patFROMNETLIFY' })[k] } };
  replies.push(reply(200, { records: [] }));
  await get();
  assert.equal(calls[1].init.headers.authorization, 'Bearer patFROMNETLIFY');
  delete globalThis.Netlify;
});

test('GET missing config -> 500 naming the variable', async () => {
  delete process.env.AIRTABLE_TOKEN;
  const res = await get();
  assert.equal(res.status, 500);
  assert.match((await body(res)).err, /AIRTABLE_TOKEN/);
});

test('POST frontend shape -> creates one record, no typecast', async () => {
  replies.push(reply(200, { records: [{ id: 'recNEW', createdTime: 'x', fields: { Notes: 'hi', Pee: true, Time: '2026-11-07T12:00:00.000Z' } }] }));
  const res = await post({ Notes: 'hi', Pee: true, Poop: false, Time: '2026-11-07T12:00:00.000Z', Accident: false });
  assert.equal(res.status, 200);
  assert.deepEqual(await body(res), { id: 'recNEW', Notes: 'hi', Pee: true, Time: '2026-11-07T12:00:00.000Z' });
  const { url, init } = calls[0];
  assert.equal(init.method, 'POST');
  assert.equal(url.href, 'https://api.airtable.com/v0/appBASE/Bathroom%20Log');
  assert.equal(init.headers['content-type'], 'application/json');
  const sent = JSON.parse(init.body);
  assert.deepEqual(sent, {
    records: [{ fields: { Notes: 'hi', Pee: true, Poop: false, Accident: false, Time: '2026-11-07T12:00:00.000Z' } }],
  });
  assert.equal('typecast' in sent, false);
});

test('POST array of {fields} with 23 records -> 3 batches of <=10', async () => {
  for (let i = 0; i < 3; i++) replies.push(() => reply(200, { records: JSON.parse(calls.at(-1).init.body).records.map((r, j) => ({ id: `r${i}${j}`, fields: r.fields })) }));
  const payload = Array.from({ length: 23 }, (_, i) => ({ fields: { Poop: true, Notes: `#${i}` } }));
  const res = await post(payload);
  assert.equal(res.status, 200);
  assert.equal((await body(res)).length, 23);
  assert.deepEqual(calls.map((c) => JSON.parse(c.init.body).records.length), [10, 10, 3]);
});

test('POST non-POST methods -> 405', async () => {
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const res = await saveBathroom(new Request('http://localhost/x', { method }));
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'POST');
  }
  assert.equal(calls.length, 0);
});

test('POST bad bodies -> 400 without calling Airtable', async () => {
  const cases = [
    'not json',
    '',
    'null',
    '"str"',
    [],
    { Pee: 'yes' },
    { Pee: false, Poop: false },
    { Pee: true, Notes: 5 },
    { Pee: true, Time: 'not a date' },
    { Pee: true, Time: 12345 },
    { Pee: true, UserId: 'someone-else' },
    { fields: { Poop: true, Evil: 1 } },
    Array.from({ length: 51 }, () => ({ Pee: true })),
  ];
  for (const c of cases) {
    const res = await post(c);
    assert.equal(res.status, 400, JSON.stringify(c));
    assert.ok((await body(res)).err);
  }
  assert.equal(calls.length, 0);
});

test('POST Airtable 422 -> 400 with Airtable message', async () => {
  replies.push(reply(422, { error: { type: 'INVALID_VALUE_FOR_COLUMN', message: 'Field "Time" cannot accept the provided value' } }));
  const res = await post({ Pee: true, Time: '2026-11-07T12:00:00Z' });
  assert.equal(res.status, 400);
  const data = await body(res);
  assert.equal(data.details.type, 'INVALID_VALUE_FOR_COLUMN');
  assert.match(data.details.message, /Time/);
});

test('POST Airtable 401/403/404/429/500 mapped, no token leak', async () => {
  const expected = { 401: 502, 403: 502, 404: 502, 429: 503, 500: 502 };
  for (const [status, mapped] of Object.entries(expected)) {
    replies.push(reply(Number(status), { error: status === '404' ? 'NOT_FOUND' : { type: 'X', message: 'm' } }));
    const res = await post({ Pee: true });
    assert.equal(res.status, mapped, status);
    await body(res);
  }
});

test('mock mode: serves sample data and keeps saved records', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  process.env.AIRTABLE_MOCK = 'true';
  process.env.AIRTABLE_MOCK_FILE = join(mkdtempSync(join(tmpdir(), 'mock-')), 'data.json');
  delete process.env.AIRTABLE_TOKEN;
  globalThis.fetch = async () => {
    throw new Error('mock mode must not call the network');
  };

  const recent = await (await getBathroom(new Request('http://x/.netlify/functions/getBathroom'))).json();
  const all = await (await getBathroom(new Request('http://x/.netlify/functions/getBathroom?days=all'))).json();
  const lastMonth = await (await getBathroom(new Request('http://x/.netlify/functions/getBathroom?days=30'))).json();
  assert.equal(recent.length, 6);
  assert.equal(lastMonth.length, 5);
  assert.equal(all.length, 6);

  const older = await (
    await getBathroom(new Request(`http://x/.netlify/functions/getBathroom?before=${encodeURIComponent(all[2].time)}`))
  ).json();
  assert.deepEqual(older, all.slice(3));

  const saved = await saveBathroom(
    new Request('http://x/.netlify/functions/saveBathroom', {
      method: 'POST',
      body: JSON.stringify({ Notes: 'new', Pee: true, Poop: false, Accident: false, Time: new Date().toISOString() }),
    }),
  );
  assert.equal(saved.status, 200);
  const after = await (await getBathroom(new Request('http://x/.netlify/functions/getBathroom'))).json();
  assert.equal(after.length, 7);
  assert.equal(after[0].notes, 'new');
});
