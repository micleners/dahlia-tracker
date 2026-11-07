const Airtable = require('airtable');

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const table = base.table(process.env.AIRTABLE_TABLE);

const DEFAULT_DAYS = 30;

// ?days=N returns records from the last N days (default 30); ?days=all returns everything.
const parseDays = (params) => {
  const raw = params && params.days;
  if (raw === undefined || raw === '') return DEFAULT_DAYS;
  if (raw === 'all') return null;
  if (!/^\d+$/.test(raw) || Number(raw) < 1) return undefined;
  return Number(raw);
};

exports.handler = async (event, context, callback) => {
  const days = parseDays(event.queryStringParameters);
  if (days === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        err: 'days must be a positive integer or "all"',
      }),
    };
  }

  const selectOptions = {
    sort: [{ field: 'Time', direction: 'desc' }],
  };
  if (days !== null) {
    selectOptions.filterByFormula = `DATETIME_DIFF(DATEADD(TODAY(),0,'d'),Time,'d')<=${days}`;
  }

  try {
    const records = await table.select(selectOptions).all();
    const formattedRecords = records.map((record) => ({
      notes: record.fields.Notes,
      pee: record.fields.Pee,
      poop: record.fields.Poop,
      time: record.fields.Time,
      accident: record.fields.Accident,
    }));
    return {
      statusCode: 200,
      body: JSON.stringify(formattedRecords),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        err: 'Error occurred while getting the history',
      }),
    };
  }
};
